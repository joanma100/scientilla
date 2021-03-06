CREATE OR REPLACE VIEW publicationgroup AS
  SELECT
    a."researchEntity",
    a.document
  FROM authorshipgroup a
    JOIN document d ON a.document = d.id
    JOIN source s ON d.source = s.id
    JOIN sourcetype st ON s.sourcetype = st.id
  WHERE a.public = TRUE
        AND st.section = ''