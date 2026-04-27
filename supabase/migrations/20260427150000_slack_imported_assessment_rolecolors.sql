CREATE OR REPLACE FUNCTION public.match_company_user_by_name(p_org_id UUID, p_name TEXT)
RETURNS TABLE (
  company_user_id UUID,
  full_name TEXT,
  job_role TEXT,
  rolecolor TEXT,
  match_confidence INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH matched AS (
    SELECT
      cu.id AS company_user_id,
      cu.full_name,
      cu.job_role,
      ar.results,
      similarity(lower(COALESCE(cu.full_name, '')), lower(COALESCE(p_name, ''))) AS similarity_score
    FROM public.company_users cu
    LEFT JOIN public.assessment_results ar
      ON ar.id = cu.assessment_result_id
    WHERE cu.company_id = p_org_id
      AND cu.status IN ('active', 'invited')
      AND COALESCE(cu.full_name, '') <> ''
      AND similarity(lower(COALESCE(cu.full_name, '')), lower(COALESCE(p_name, ''))) > 0.8
    ORDER BY similarity_score DESC, cu.created_at ASC
    LIMIT 1
  )
  SELECT
    matched.company_user_id,
    matched.full_name,
    matched.job_role,
    COALESCE(
      NULLIF(lower(trim(COALESCE(matched.results ->> 'dominantColor', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'dominant_color', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'primaryColor', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'primary_color', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'role_color', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'color', ''))), ''),
      score_color.rolecolor
    ) AS rolecolor,
    GREATEST(0, LEAST(100, round(matched.similarity_score * 100)::INTEGER)) AS match_confidence
  FROM matched
  LEFT JOIN LATERAL (
    SELECT color AS rolecolor
    FROM (
      VALUES
        ('red', COALESCE(matched.results -> 'scores' ->> 'red', matched.results -> 'colorScores' ->> 'red')),
        ('yellow', COALESCE(matched.results -> 'scores' ->> 'yellow', matched.results -> 'colorScores' ->> 'yellow')),
        ('green', COALESCE(matched.results -> 'scores' ->> 'green', matched.results -> 'colorScores' ->> 'green')),
        ('blue', COALESCE(matched.results -> 'scores' ->> 'blue', matched.results -> 'colorScores' ->> 'blue'))
    ) AS color_scores(color, raw_score)
    WHERE raw_score ~ '^-?[0-9]+(\.[0-9]+)?$'
    ORDER BY raw_score::NUMERIC DESC
    LIMIT 1
  ) score_color ON TRUE;
$$;

WITH derived AS (
  SELECT
    ar.id,
    score_color.rolecolor
  FROM public.assessment_results ar
  LEFT JOIN LATERAL (
    SELECT color AS rolecolor
    FROM (
      VALUES
        ('red', COALESCE(ar.results -> 'scores' ->> 'red', ar.results -> 'colorScores' ->> 'red')),
        ('yellow', COALESCE(ar.results -> 'scores' ->> 'yellow', ar.results -> 'colorScores' ->> 'yellow')),
        ('green', COALESCE(ar.results -> 'scores' ->> 'green', ar.results -> 'colorScores' ->> 'green')),
        ('blue', COALESCE(ar.results -> 'scores' ->> 'blue', ar.results -> 'colorScores' ->> 'blue'))
    ) AS color_scores(color, raw_score)
    WHERE raw_score ~ '^-?[0-9]+(\.[0-9]+)?$'
    ORDER BY raw_score::NUMERIC DESC
    LIMIT 1
  ) score_color ON TRUE
  WHERE ar.results IS NOT NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'dominantColor', ''))), '') IS NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'dominant_color', ''))), '') IS NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'primaryColor', ''))), '') IS NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'primary_color', ''))), '') IS NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'role_color', ''))), '') IS NULL
    AND NULLIF(lower(trim(COALESCE(ar.results ->> 'color', ''))), '') IS NULL
    AND score_color.rolecolor IS NOT NULL
)
UPDATE public.assessment_results ar
SET results = jsonb_set(ar.results::jsonb, '{dominantColor}', to_jsonb(derived.rolecolor), true)
FROM derived
WHERE ar.id = derived.id;
