function normalizeTrial(study) {
  const protocol = study.protocolSection || {};
  const identification = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const contacts = protocol.contactsLocationsModule || {};
  const eligibility = protocol.eligibilityModule || {};

  return {
    id: identification.nctId,
    title: identification.briefTitle || identification.officialTitle || "",
    status: status.overallStatus || "Unknown",
    phase: protocol.designModule?.phases?.join(", ") || "N/A",
    summary: protocol.descriptionModule?.briefSummary || "",
    conditions: protocol.conditionsModule?.conditions || [],
    eligibility:
      eligibility.eligibilityCriteria ||
      `${eligibility.sex || "All"} | Minimum age: ${eligibility.minimumAge || "N/A"} | Maximum age: ${eligibility.maximumAge || "N/A"}`,
    location:
      (contacts.locations || [])
        .slice(0, 3)
        .map((entry) =>
          [entry.facility, entry.city, entry.state, entry.country].filter(Boolean).join(", ")
        )
        .join(" | ") || "Multiple / not specified",
    contact:
      (contacts.centralContacts || [])
        .slice(0, 2)
        .map((entry) => [entry.name, entry.phone, entry.email].filter(Boolean).join(" | "))
        .join(" ; ") || "See ClinicalTrials.gov listing",
    url: identification.nctId
      ? `https://clinicaltrials.gov/study/${identification.nctId}`
      : "https://clinicaltrials.gov/",
    source: "ClinicalTrials.gov",
    raw: study
  };
}

export async function fetchClinicalTrials({ expandedQuery, disease, location }) {
  const attempts = [
    [expandedQuery, disease, location].filter(Boolean).join(" "),
    [disease, expandedQuery].filter(Boolean).join(" "),
    disease,
    expandedQuery
  ].filter(Boolean);

  let data = null;

  for (const attempt of attempts) {
    const url =
      "https://clinicaltrials.gov/api/v2/studies" +
      `?query.term=${encodeURIComponent(attempt)}` +
      "&pageSize=20";

    const response = await fetch(url);
    if (response.ok) {
      data = await response.json();
      break;
    }
  }

  if (!data) {
    throw new Error("ClinicalTrials.gov request failed after retrying simplified queries");
  }

  const studies =
    data.studies ||
    data.StudyFieldsResponse?.StudyFields ||
    data.FullStudiesResponse?.FullStudies ||
    [];

  if (data.studies) {
    return data.studies.map(normalizeTrial);
  }

  return studies.map((study) => normalizeTrial(study.Study || study.FullStudy?.Study || {}));
}
