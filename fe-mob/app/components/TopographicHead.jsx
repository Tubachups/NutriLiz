import Svg, { Path } from "react-native-svg";
import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const TopographicHeader = ({ insetTop }) => (
  <Svg
    width={width}
    height={90 + insetTop}
    viewBox={`0 0 ${width} ${90 + insetTop}`}
  >
    {/* Base green background */}
    <Path d={`M0,0 L${width},0 L${width},${70 + insetTop} L0,${70 + insetTop} Z`} fill="#77dfbcff" />

    {/* Topographic contour lines */}
    {[...Array(10)].map((_, i) => (
      <Path
        key={i}
        d={`M${-50},${insetTop + 5 + i * 8} 
            Q${width * 0.25},${insetTop - 5 + i * 8} ${width * 0.5},${insetTop + 10 + i * 8}
            Q${width * 0.75},${insetTop + 25 + i * 8} ${width + 50},${insetTop + 5 + i * 8}`}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.5"
        fill="none"
      />
    ))}

    {[...Array(8)].map((_, i) => (
      <Path
        key={`c2-${i}`}
        d={`M${-30},${insetTop + 8 + i * 10} 
            Q${width * 0.3},${insetTop + 20 + i * 10} ${width * 0.6},${insetTop + i * 10}
            Q${width * 0.85},${insetTop - 10 + i * 10} ${width + 30},${insetTop + 15 + i * 10}`}
        stroke="rgba(200, 255, 233, 0.25)"
        strokeWidth="1"
        fill="none"
      />
    ))}

    {/* Green wavy area at the bottom */}
    <Path
      d={`M0,${65 + insetTop} 
          Q${width * 0.15},${72 + insetTop} ${width * 0.3},${68 + insetTop}
          Q${width * 0.5},${62 + insetTop} ${width * 0.7},${72 + insetTop}
          Q${width * 0.85},${78 + insetTop} ${width},${68 + insetTop}
          L${width},${90 + insetTop} L0,${90 + insetTop} Z`}
      fill="#67caa9ff"
    />

    {/* Dark wavy border line at top of green area */}
    <Path
      d={`M0,${65 + insetTop} 
          Q${width * 0.15},${72 + insetTop} ${width * 0.3},${68 + insetTop}
          Q${width * 0.5},${62 + insetTop} ${width * 0.7},${72 + insetTop}
          Q${width * 0.85},${78 + insetTop} ${width},${68 + insetTop}`}
      stroke="#45a787ff"
      strokeWidth="2"
      fill="none"
    />

    {/* Dark green border at bottom */}
    <Path
      d={`M0,${90 + insetTop} L${width},${90 + insetTop}`}
      stroke="#3d8a6e"
      strokeWidth="3"
      fill="none"
    />
  </Svg>
);

export default TopographicHeader;