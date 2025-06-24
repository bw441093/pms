import { createTheme } from '@mui/material/styles';

// Module augmentation for custom palette
declare module '@mui/material/styles' {
  interface Palette {
    custom: CustomPalette;
  }
  interface PaletteOptions {
    custom?: CustomPalette;
  }
}

export interface CustomPalette {
  gray1: string;
  gray2: string;
  gray3: string;
  gray4: string;
  gray5: string;
  outlineVariant: string;
  outline: string;
  surfaceBright: string;
  surfaceContainerHighest: string;
  surfaceContainerHigh: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  gray13: string;
  blue: string;
  lightBlue: string;
  error: string;
  success: string;
}

const theme = createTheme({
  palette: {
    custom: {
      gray1: '#FFFFFF', // text
      gray2: '#FAFAFA', // text
      gray3: '#F5F5F5', // text
      gray4: '#F0F0F0', // text
      gray5: '#D9D9D9', // text
      outlineVariant: '#BFBFBF',
      outline: '#8C8C8C',
      surfaceBright: '#595959',
      surfaceContainerHighest: '#434343',
      surfaceContainerHigh: '#343434',
      surfaceContainer: '#262626',
      surfaceContainerLow: '#1F1F1F',
      surfaceContainerLowest: '#141414',
      gray13: '#000000', // bg
      blue: '#0077FF', // MainColors
      lightBlue: '#CAD9FF',
      error: '#E94444',
      success: '#0FCE75',
    },
  },
});

export default theme; 