export const BitFlag = {
    GENERAL_INTERFACE: 0, /**< Default interface for all INDI devices */
    TELESCOPE_INTERFACE: (1 << 0), /**< Telescope interface, must subclass INDI::Telescope */
    CCD_INTERFACE: (1 << 1), /**< CCD interface, must subclass INDI::CCD */
    GUIDER_INTERFACE: (1 << 2), /**< Guider interface, must subclass INDI::GuiderInterface */
    FOCUSER_INTERFACE: (1 << 3), /**< Focuser interface, must subclass INDI::FocuserInterface */
    FILTER_INTERFACE: (1 << 4), /**< Filter interface, must subclass INDI::FilterInterface */
    DOME_INTERFACE: (1 << 5), /**< Dome interface, must subclass INDI::Dome */
    GPS_INTERFACE: (1 << 6), /**< GPS interface, must subclass INDI::GPS */
    WEATHER_INTERFACE: (1 << 7), /**< Weather interface, must subclass INDI::Weather */
    AO_INTERFACE: (1 << 8), /**< Adaptive Optics Interface */
    DUSTCAP_INTERFACE: (1 << 9), /**< Dust Cap Interface */
    LIGHTBOX_INTERFACE: (1 << 10), /**< Light Box Interface */
    DETECTOR_INTERFACE: (1 << 11), /**< Detector interface, must subclass INDI::Detector */
    ROTATOR_INTERFACE: (1 << 12), /**< Rotator interface, must subclass INDI::RotatorInterface */
    SPECTROGRAPH_INTERFACE: (1 << 13), /**< Spectrograph interface */
    CORRELATOR_INTERFACE: (1 << 14), /**< Correlators (interferometers) interface */
    AUX_INTERFACE: (1 << 15), /**< Auxiliary interface */
};
