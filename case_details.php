<?php
require 'db.php';
header('Content-Type: application/json');

$case_id = intval($_GET['case_id'] ?? 0);
if ($case_id <= 0) {
    echo json_encode(['error' => 'Invalid case id']);
    exit;
}

/* CASE INFO */
$sql = "
SELECT mc.*, p.PAT_CITY AS city, tc.SPECIALTY,
ROUND((mc.CASE_COLL_AMOUNT / mc.CASE_REQ_AMOUNT)*100,0) AS progress_percentage
FROM MEDICAL_CASE mc
JOIN PATIENT p ON p.PATIENT_ID = mc.PATIENT_ID
LEFT JOIN TREATMENT_CASE tc ON tc.CASE_ID = mc.CASE_ID
WHERE mc.CASE_ID = ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$case_id]);
$case_info = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$case_info) {
    echo json_encode(['error'=>'Case not found']);
    exit;
}

/* DONATIONS */
$stmt = $pdo->prepare("
SELECT d.DONATION_AMOUNT,d.DONATION_DATE,
IF(d.IS_ANONYMOUS=1,'Anonymous',CONCAT(dr.DONOR_FIRST_NAME,' ',dr.DONOR_LAST_NAME)) AS donor_name
FROM DONATION d
LEFT JOIN DONOR dr ON dr.DONOR_ID=d.DONOR_ID
WHERE d.CASE_ID=?
ORDER BY d.DONATION_DATE DESC
");
$stmt->execute([$case_id]);
$donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* DONOR COUNT */
$stmt = $pdo->prepare("SELECT COUNT(*) FROM DONATION WHERE CASE_ID=?");
$stmt->execute([$case_id]);
$total_donors = $stmt->fetchColumn();

/* PROVIDERS */
$stmt = $pdo->prepare("
SELECT mp.PROVIDER_NAME,pd.SERVICE_NAME
FROM MEDICAL_PROVIDER mp
JOIN PROVIDER_DONATION pd ON mp.PROVIDER_ID=pd.PROVIDER_ID
JOIN CASE_PROVIDER cp ON cp.PROVIDER_ID=mp.PROVIDER_ID
WHERE cp.CASE_ID=?
");
$stmt->execute([$case_id]);
$provider_donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'case_info'=>$case_info,
    'donations'=>$donations,
    'total_donors'=>$total_donors,
    'provider_donations'=>$provider_donations
]);