import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { isEmpty } from 'lodash';

export default function RadioButton({ title, handleChange, checked, data, disabled, styles = {} })
{
  return (
    <FormControl sx={{ ...styles }}>
      {!isEmpty(data) && <FormLabel id="demo-radio-buttons-group-label">{title}</FormLabel>}
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        defaultValue="female"
        name="radio-buttons-group"
        sx={{ gap: "12px" }}
      >
        {!isEmpty(data) && data.map((oneData, index) => 
        {
          return (
            <FormControlLabel sx={{ color: "white", marginLeft: 0, marginRight: 0 }} value={index} control={<Radio key={index}
              style={{ color: "white", padding: 0, marginRight: "10px" }}
              checked={oneData.value}
              onClick={() => 
              {
                oneData.handleChange(index);
              }} />
            } label={oneData.label} key={oneData.label} />
          )
        }
        )}
        {isEmpty(data) && <FormControlLabel sx={{ color: "white", marginLeft: 0, marginRight: 0, ".Mui-disabled": { color: "white !important" } }}
        control={<Radio style={{ color: "white", padding: 0, marginRight: "10px" }} disabled={disabled} checked={checked}
          onClick={(value) =>
          {
            handleChange(value);
          }} />
        } label={title} />
        }
      </RadioGroup>
    </FormControl>
  );
}