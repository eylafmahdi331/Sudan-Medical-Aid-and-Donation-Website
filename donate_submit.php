<?php
session_start();
include 'db.php';
header('Content-Type: application/json');

// 1️⃣ Login required
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

// 2️⃣ Only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// 3️⃣ Get user & donation info
$userId = $_SESSION['user_id'];
$donationAmount = $_POST['donation_amount'] ?? 0;
$donationType = $_POST['donation_type'] ?? 'general'; // general, case, campaign
$relatedID = $_POST['related_id'] ?? null;
$frequency = $_POST['donation_frequency'] ?? 'one-time';

// Donor info from form
$firstName = $_POST['first_name'] ?? null;
$lastName = $_POST['last_name'] ?? null;
$email = $_POST['email'] ?? null;
$phone = $_POST['phone'] ?? null;
$country = $_POST['country'] ?? null;
$isAnonymous = isset($_POST['is_anonymous']) ? (int)$_POST['is_anonymous'] : 0;

// Payment method info
$paymentMethod = $_POST['payment_method'] ?? 'credit';
$cardNumber = $_POST['card_number'] ?? null;
$expiryDate = $_POST['expiry_date'] ?? null;
$cvv = $_POST['cvv'] ?? null;

// Validation
if ($donationAmount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid donation amount']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 4️⃣ Check if donor exists
    $stmt = $pdo->prepare("SELECT * FROM DONOR WHERE USER_ID = ?");
    $stmt->execute([$userId]);
    $donor = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($donor) {
        $donorId = $donor['DONOR_ID'];
        // Update donor info if any changes
        $stmt = $pdo->prepare("
            UPDATE DONOR
            SET DONOR_FIRST_NAME = ?, DONOR_LAST_NAME = ?, DONOR_EMAIL = ?, DONOR_PHONE = ?, DONOR_COUNTRY = ?
            WHERE DONOR_ID = ?
        ");
        $stmt->execute([
            $firstName ?? $donor['DONOR_FIRST_NAME'],
            $lastName ?? $donor['DONOR_LAST_NAME'],
            $email ?? $donor['DONOR_EMAIL'],
            $phone ?? $donor['DONOR_PHONE'],
            $country ?? $donor['DONOR_COUNTRY'],
            $donorId
        ]);
    } else {
        // Insert new donor
        $stmt = $pdo->prepare("
            INSERT INTO DONOR (USER_ID, DONOR_FIRST_NAME, DONOR_LAST_NAME, DONOR_EMAIL, DONOR_PHONE, DONOR_COUNTRY)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $firstName, $lastName, $email, $phone, $country]);
        $donorId = $pdo->lastInsertId();
    }

    // 5️⃣ Insert donation
    $stmt = $pdo->prepare("
        INSERT INTO DONATION (DONOR_ID, DONATION_AMOUNT, DONATION_TYPE, DONATION_FREQUENCY, IS_ANONYMOUS)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$donorId, $donationAmount, $donationType, $frequency, $isAnonymous]);
    $donationId = $pdo->lastInsertId();

    // 5️⃣a Insert payment method using project schema
    // Convert expiry like MM/YY or MM/YYYY to YYYY-MM-01 for DATE column
    $expirySql = null;
    if (!empty($expiryDate)) {
        if (preg_match('/^(\d{2})\/(\d{2})$/', $expiryDate, $m)) {
            $month = $m[1];
            $year = '20' . $m[2];
            $expirySql = sprintf('%04d-%02d-01', (int)$year, (int)$month);
        } elseif (preg_match('/^(\d{2})\/(\d{4})$/', $expiryDate, $m)) {
            $month = $m[1];
            $year = $m[2];
            $expirySql = sprintf('%04d-%02d-01', (int)$year, (int)$month);
        } elseif (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $expiryDate)) {
            $expirySql = $expiryDate; // already YYYY-MM-DD
        }
    }

    $paymentInserted = false;
    $paymentId = null;
    $paymentSkippedReason = null;

    if ($cardNumber || $cvv || $expiryDate) {
        if ($cardNumber && $cvv && $expirySql) {
            $stmt = $pdo->prepare("
                INSERT INTO PAYMENT_METHOD (DONATION_ID, METHOD_TYPE, CARD_NUM, CVV, EXPIRY_DATE)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$donationId, $paymentMethod, $cardNumber, $cvv, $expirySql]);
            $paymentInserted = true;
            $paymentId = $pdo->lastInsertId();
        } else {
            $paymentSkippedReason = 'Incomplete or invalid card details; payment row not inserted.';
        }
    }

    // 6️⃣ Handle case/campaign donations
    if ($donationType === 'case' && $relatedID) {
        // Link donation to case
        $stmt = $pdo->prepare("INSERT INTO CASE_DONATION (DONATION_ID, CASE_ID) VALUES (?, ?)");
        $stmt->execute([$donationId, $relatedID]);

        // Update case collected amount
        $stmt = $pdo->prepare("UPDATE MEDICAL_CASE SET CASE_COLL_AMOUNT = CASE_COLL_AMOUNT + ? WHERE CASE_ID = ?");
        $stmt->execute([$donationAmount, $relatedID]);

    } elseif ($donationType === 'campaign' && $relatedID) {
        // Link donation to campaign - CAMPAIGN_DONATION only needs DONATION_ID and CAMP_ID
        $stmt = $pdo->prepare("INSERT INTO CAMPAIGN_DONATION (DONATION_ID, CAMP_ID) VALUES (?, ?)");
        $stmt->execute([$donationId, $relatedID]);
    }
    // general → nothing extra

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'donation_id' => $donationId,
        'payment_inserted' => $paymentInserted,
        'payment_id' => $paymentId,
        'payment_skipped_reason' => $paymentSkippedReason
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}