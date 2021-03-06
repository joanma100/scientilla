SELECT
  d.year   AS year,
  count(*) AS value
FROM authorship a
  JOIN document d ON a.document = d.id
  JOIN source s ON d.source = s.id
WHERE a."researchEntity" = $1
      AND s.type = $2
GROUP BY d.year