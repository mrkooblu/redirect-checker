import 'styled-components';

type ColorPalette = {
  primary: string;
  secondary: string;
  background: {
    primary: string;
    secondary: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
  hover: string;
  success: string;
  info: string;
  warning: string;
  error: string;
};

type FontFamily = {
  primary: string;
  mono: string;
};

type FontWeights = {
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
};

type FontSizes = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
};

type HeadingStyles = {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
};

type Heading = {
  h1: HeadingStyles;
  h2: HeadingStyles;
  h3: HeadingStyles;
  body: HeadingStyles;
};

type Spacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
};

type BorderRadius = {
  sm: string;
  md: string;
  lg: string;
  full: string;
};

type Shadows = {
  sm: string;
  md: string;
  lg: string;
  card: string;
};

type Breakpoints = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: ColorPalette;
    fonts: {
      family: FontFamily;
      weights: FontWeights;
    };
    fontSizes: FontSizes;
    heading: Heading;
    spacing: Spacing;
    borderRadius: BorderRadius;
    shadows: Shadows;
    breakpoints: Breakpoints;
    transition: {
      default: string;
    };
  }
} 