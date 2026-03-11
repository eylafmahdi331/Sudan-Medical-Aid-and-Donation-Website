<?php
echo "PUBLIC CASE FILE LOADED";
exit;

<?php
require_once 'db.php';

$search       = $_GET['search'] ?? '';
$sort         = $_GET['sort'] ?? 'new';
$type_filter  = $_GET['type'] ?? '';
$urgent_only  = isset($_GET['urgent']) ? 1 : 0;
$less50       = isset($_GET['less50']) ? 1 : 0;
$specialty    = $_GET['specialty'] ?? '';

$where = "mc.CASE_STATUS = 'approved'";
$params = [];
$types  = "";

// Search
if ($search !== '') {
    $where .= " AND mc.CASE_TITLE LIKE ?";
    $params[] = "%$search%";
    $types .= "s";
}

// Type
if ($type_filter !== '') {
    $where .= " AND mc.CASE_TYPE = ?";
    $params[] = $type_filter;
    $types .= "s";
}

// Urgent
if ($urgent_only) {
    $where .= " AND mc.CASE_URGENCY = 'urgent'";
}

// Less than 50%
if ($less50) {
    $where .= " AND (mc.CASE_COLL_AMOUNT / NULLIF(mc.CASE_REQ_AMOUNT,0)) < 0.5";
}

// Specialty (only if Treatment)
if ($specialty !== '') {
    $where .= " AND tc.SPECIALTY = ?";
    $params[] = $specialty;
    $types .= "s";
}

$order = ($sort === 'old') ? "ASC" : "DESC";

$sql = "
SELECT 
    mc.CASE_ID,
    mc.CASE_TITLE,
    LEFT(mc.CASE_DESCRIPTION, 120) AS short_description,
    mc.CASE_TYPE,
    mc.CASE_URGENCY,
    mc.CASE_REQ_AMOUNT,
    mc.CASE_COLL_AMOUNT,
    ROUND((mc.CASE_COLL_AMOUNT / NULLIF(mc.CASE_REQ_AMOUNT,0))*100, 0) AS progress_percentage,
    p.PAT_CITY,
    tc.SPECIALTY,
    (
        SELECT DATE_FORMAT(h.HIS_UPDATED_AT, '%b %d')
        FROM MED_CASE_HISTORY h
        WHERE h.CASE_ID = mc.CASE_ID
          AND h.FIELD_UPDATED = 'CASE_STATUS'
          AND h.NEW_VALUE = 'approved'
        ORDER BY h.HIS_UPDATED_AT ASC
        LIMIT 1
    ) AS approved_date,
    (
        SELECT GROUP_CONCAT(FILE_PATH SEPARATOR '|')
        FROM MEDICAL_FILE mf
        WHERE mf.CASE_ID = mc.CASE_ID
    ) AS images
FROM MEDICAL_CASE mc
JOIN PATIENT p ON mc.PATIENT_ID = p.PATIENT_ID
LEFT JOIN TREATMENT_CASE tc ON mc.CASE_ID = tc.CASE_ID
WHERE $where
ORDER BY mc.CASE_CREATED_AT $order
";

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$cards = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();


