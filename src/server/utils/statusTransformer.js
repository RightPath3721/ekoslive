const statusTransformer = (rawStatus) => {
  try {
    const transformed = {
      ...rawStatus,
      capture: transformCapture(rawStatus?.capture),
      mount: transformMount(rawStatus?.mount), 
      focus: transformFocus(rawStatus?.focus),
      guide: transformGuide(rawStatus?.guide),
      align: transformAlign(rawStatus?.align),
      dome: transformDome(rawStatus?.dome),
    };
    return transformed;
  } catch (error) {
    return rawStatus;
  }
};

const transformCapture = (capture) => {
  if (!capture) return null;
  return {
    ...capture,
    status: capture.status,
    expr: `Total exposure duration in seconds of a single exposure. Current value is ${capture.expr}`,
    expv: `How many seconds are remaining until the current single exposure is complete. Current value is ${capture.expv}`,
    seqr: `Sequence duration in seconds. Current value is ${capture.seqr}`,
    seqv: `How many seconds until the sequence is complete. Current value is ${capture.seqv}`,
    seqt: `Sequence remaining time. Current value is ${capture.seqt}`,
    ovp: `Overall percentage of completed exposures. Current value is ${capture.ovp}`,
    ovt: `Overall remaining time for all exposures. Current value is ${capture.ovt}`
  };
};

const transformMount = (mount) => {
  if (!mount) return null;
  return {
    ...mount,
    status: mount.status,
    target: `Current target is ${mount.target}`,
    ra: `Right Ascension. Current value is ${mount.ra}`,
    de: `Declination. Current value is ${mount.de}`, 
    az: `Azimuth. Current value is ${mount.az}`,
    at: `Altitude. Current value is ${mount.at}`,
    pierSide: mount.pierSide,
    ha: `Hour Angle. Current value is ${mount.ha}`,
    de0: `Declination for J2000. Value is ${mount.de0}`,
    ra0: `Right Ascension for J2000. Value is ${mount.ra0}`
  };
};

const transformFocus = (focus) => {
  if (!focus) return null;
  return {
    ...focus,
    status: focus.status,
    looping: `If the focus is in looping operation. Current value is ${focus.looping}`,
    hfr: `Half Flux Radius. Current value is ${focus.hfr}`,
    pos: `Focus Absolute Position in Steps. Current value is ${focus.pos}`
  };
};

const transformGuide = (guide) => {
  if (!guide) return null;
  return {
    ...guide,
    status: guide.status,
    rarms: `The guiding Root-Mean-Square error for Right Ascension axis in arc-seconds. Current value is ${guide.rarms}`,
    derms: `The guiding Root-Mean-Square error for Declination axis in arc-seconds. Current value is ${guide.derms}`,
    drift_ra: `The Right Ascension guide drift in arcseconds between current and guide star coordinates. Current value is ${guide.drift_ra}`,
    drift_de: `The Declination guide drift in arcseconds between current and guide star coordinates. Current value is ${guide.drift_de}`
  };
};

const transformAlign = (align) => {
  if (!align) return null;
  return {
    ...align,
    status: align.status,
    solution: align.solution ? {
      ...align.solution,
      ra: `Solved image Right Ascension value in hours. Current value is ${align.solution.ra}`,
      de: `Solved image Declination value in degrees. Current value is ${align.solution.de}`,
      dRA: `Right Ascension Error in arcseconds between solved image and target coordinates. Current value is ${align.solution.dRA}`,
      dDE: `Declination Error in arcseconds between solved image and target coordinates. Current value is ${align.solution.dDE}`
    } : null
  };
};

const transformDome = (dome) => {
  if (!dome) return null;
  return {
    ...dome,
    status: dome.status,
    az: `Dome Azimuth value in degrees. Current value is ${dome.az}`
  };
};

module.exports = statusTransformer;
