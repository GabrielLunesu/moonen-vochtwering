export const PIPELINE_STAGES = {
  nieuw: {
    label: "Nieuw",
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500",
    order: 0,
  },
  uitgenodigd: {
    label: "Uitgenodigd",
    color: "bg-purple-100 text-purple-800",
    dotColor: "bg-purple-500",
    order: 1,
  },
  bevestigd: {
    label: "Bevestigd",
    color: "bg-indigo-100 text-indigo-800",
    dotColor: "bg-indigo-500",
    order: 2,
  },
  bezocht: {
    label: "Bezocht",
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500",
    order: 3,
  },
  offerte_verzonden: {
    label: "Offerte verzonden",
    color: "bg-orange-100 text-orange-800",
    dotColor: "bg-orange-500",
    order: 4,
  },
  akkoord: {
    label: "Akkoord",
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500",
    order: 5,
  },
  verloren: {
    label: "Verloren",
    color: "bg-red-100 text-red-800",
    dotColor: "bg-red-500",
    order: 6,
  },
};

export const STAGE_ORDER = Object.keys(PIPELINE_STAGES);

export const PROBLEEM_TYPES = {
  opstijgend_vocht: "Opstijgend vocht",
  lekkage: "Lekkage",
  condensatie: "Condensatie",
  schimmel: "Schimmel",
  anders: "Anders",
};
