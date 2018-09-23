import {
  Theme as MuiTheme,
  createMuiTheme,
  colors as MuiColors,
} from '@material-ui/core';
import { FontWeightProperty } from 'csstype';

export const colors = {
  amber: MuiColors.amber,
  blue: MuiColors.blue,
  blueGrey: MuiColors.blueGrey,
  brown: MuiColors.brown,
  cyan: MuiColors.cyan,
  deepOrange: MuiColors.deepOrange,
  deepPurple: MuiColors.deepPurple,
  green: MuiColors.green,
  grey: MuiColors.grey,
  indigo: MuiColors.indigo,
  lightBlue: MuiColors.lightBlue,
  lightGreen: MuiColors.lightGreen,
  lime: MuiColors.lime,
  orange: MuiColors.orange,
  pink: MuiColors.pink,
  purple: MuiColors.purple,
  red: MuiColors.red,
  teal: MuiColors.teal,
  yellow: MuiColors.yellow,
};
export type Colors = typeof colors;

export namespace CommonColors {
  export const { white, black } = MuiColors.common;
}
const { grey } = colors;
const customTheme = {
  shared: {
    fontWeight: { bold: 'bold' as FontWeightProperty },
    borderWidth: { thick: 4 },
    table: {
      headerBackgroundColor: grey['900'],
      borderColor: grey['400'],
      headerColor: CommonColors.white,
    },
  },
};
export type Theme = typeof customTheme & MuiTheme;
export const createTheme = () => {
  return createMuiTheme(customTheme as Theme) as Theme;
};
