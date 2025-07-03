import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';

export default function LinearDeterminate({progress, color="primary"}) {
  return (
      <LinearProgress color={color} variant="determinate" value={progress} />
  );
}
