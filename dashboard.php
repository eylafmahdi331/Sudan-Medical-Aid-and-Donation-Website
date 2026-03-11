<?php
require 'db.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    /* ================= USER NAME (PATIENT) ================= */
    $stmt = $pdo->prepare("
        SELECT CONCAT(PAT_FNAME,' ',PAT_LNAME) AS user_name
        FROM PATIENT
        WHERE USER_ID = ?
    ");
    $stmt->execute([$userId]);
    $userName = $stmt->fetchColumn();

    /* ================= STATS ================= */
    // Use subqueries / DISTINCT to avoid duplicate rows when joining other tables
    $stmt = $pdo->prepare("SELECT
        (SELECT COALESCE(SUM(d2.DONATION_AMOUNT),0)
            FROM DONATION d2
            JOIN DONOR dr2 ON d2.DONOR_ID = dr2.DONOR_ID
            WHERE dr2.USER_ID = ?) AS total_donated,
        (SELECT COUNT(DISTINCT d2.DONATION_ID)
            FROM DONATION d2
            JOIN DONOR dr2 ON d2.DONOR_ID = dr2.DONOR_ID
            WHERE dr2.USER_ID = ?) AS donation_count,
        (SELECT COUNT(DISTINCT mc2.CASE_ID)
            FROM MEDICAL_CASE mc2
            JOIN PATIENT p2 ON mc2.PATIENT_ID = p2.PATIENT_ID
            WHERE p2.USER_ID = ?) AS cases_submitted
    ");
    $stmt->execute([$userId, $userId, $userId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    /* ================= DONATIONS ================= */
  $stmt = $pdo->prepare("
    SELECT 
        d.DONATION_AMOUNT,
        d.DONATION_DATE,
        mc.CASE_TITLE AS CASE_TITLE

    FROM DONATION d
    JOIN DONOR dr 
        ON d.DONOR_ID = dr.DONOR_ID

    LEFT JOIN CASE_DONATION cd 
        ON d.DONATION_ID = cd.DONATION_ID

    LEFT JOIN MEDICAL_CASE mc 
        ON cd.CASE_ID = mc.CASE_ID

    WHERE dr.USER_ID = ?
    ORDER BY d.DONATION_DATE DESC
");
$stmt->execute([$userId]);
$donations = $stmt->fetchAll(PDO::FETCH_ASSOC);


    /* ================= CASES ================= */
    $stmt = $pdo->prepare("
        SELECT 
            mc.CASE_ID,
            mc.CASE_TITLE,
            mc.CASE_REQ_AMOUNT,
            mc.CASE_COLL_AMOUNT,
            mc.CASE_STATUS,
            mc.CASE_CREATED_AT
        FROM MEDICAL_CASE mc
        JOIN PATIENT p ON mc.PATIENT_ID = p.PATIENT_ID
        WHERE p.USER_ID = ?
        ORDER BY mc.CASE_CREATED_AT DESC
    ");
    $stmt->execute([$userId]);
    $cases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ================= FINAL JSON ================= */
    echo json_encode([
        'user_name' => $userName,
        'stats' => [
            'total_donated' => $stats['total_donated'],
            'donation_count' => $stats['donation_count'],
            'cases_submitted' => $stats['cases_submitted']
        ],
        'donations' => $donations,
        'cases' => $cases
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
