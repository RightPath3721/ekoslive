import React from "react";
import Svg, {Circle, G, Path, Text as SVGText, TSpan} from "react-native-svg";

const domeDirectionsSVG = (
    <Svg viewBox="0 0 160 160" height="100%" width="100%">
        <G id="Ekos" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <Path d="M81.25,19.5 L81.25,145.5" id="Line-3" stroke="#FFFFFF" strokeLinecap="square"/>
            <Path d="M144.05,82.7 L18.05,82.7" id="Line-3" stroke="#FFFFFF" strokeLinecap="square"/>
            <SVGText id="W" fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                <TSpan x="0" y="85">
                    W
                </TSpan>
            </SVGText>
            <SVGText id="E" fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                <TSpan x="148" y="85">
                    E
                </TSpan>
            </SVGText>
            <SVGText id="N" fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                <TSpan x="77" y="11">
                    N
                </TSpan>
            </SVGText>
            <SVGText id="S" fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                <TSpan x="77" y="158">
                    S
                </TSpan>
            </SVGText>
        </G>
    </Svg>
);

const domeShutterDirectionSVG = (
    <Svg viewBox="0 0 160 160" height="100%" width="100%">
        <G id="Ekos" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <Circle id="Oval-5" stroke="#FFFFFF" strokeWidth="2" cx="80.5" cy="81.5" r="62.5"/>
            <Circle id="Oval-5" stroke="#FFFFFF" cx="80.5" cy="81.5" r="48.5"/>
            <Path
                d="M74.0038683,33.2220925 L70.1539489,20.3918819 C74.8035655,19.5553725 78.382772,19.1371178 80.8915685,19.1371178 C83.400365,19.1371178 86.9795715,19.5553725 91.6291881,20.3918819 L88.8140375,33.2220925 C85.1872604,33.2220925 82.5464374,33.2220925 80.8915685,33.2220925 C79.2366996,33.2220925 76.9407996,33.2220925 74.0038683,33.2220925 Z"
                id="Path-3"
                fill="#FFFFFF"
            />
        </G>
    </Svg>
);

export default {
    domeDirectionsSVG,
    domeShutterDirectionSVG
};
