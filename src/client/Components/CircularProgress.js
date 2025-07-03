import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { styles } from '../shared/styles';
import { get } from 'lodash';


/**
 * Description placeholder.
 * @param {*} props
 * @returns {*}
 */
function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress color='warning' variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={[styles.text, {fontSize: "10px"}]} variant="caption" color="text.secondary">
          {`${(props.progress)} ${get(props, "isSummary", false) ? "s": ""}`}
        </Typography>
      </Box>
    </Box>
  );
}


/**
 * Description placeholder.
 *
 * @param {{ value: any; progress: any; }} param0
 * @param {*} param0.value
 * @param {*} param0.progress
 * @returns {*}
 * @export
 */
export default function CircularStatic({value, progress}) {
  return <CircularProgressWithLabel value={value} progress={progress}/>;
}
