export function projectTwitchStreamMapCountryOnly(model) {
  if (!model || typeof model !== 'object') return model
  return {
    ...model,
    mappedStreams: (Array.isArray(model.mappedStreams) ? model.mappedStreams : []).map((row) => ({
      ...row,
      location: {
        ...row.location,
        regions: [],
        cities: [],
      },
      evidence: (Array.isArray(row.evidence) ? row.evidence : []).map((evidence) => ({
        ...evidence,
        region: null,
        city: null,
      })),
    })),
  }
}
