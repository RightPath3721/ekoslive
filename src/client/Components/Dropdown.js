import React from "react";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";

const Dropdown = ({
  options,
  width = "120px",
  placeholder = "None",
  background = "#1d1d1d",
  isClearable = false,
  disabled = false,
  onChange,
  type = "",
  value,
  label,
  containerStyles = {},
  isCreatable = false,
}) => {
  const customStyles = {
    control: (base) => ({
      ...base,
      background: background,
      borderWidth: 0,
      color: "white",
      textAlign: "center",
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: "#1d1d1d",
      color: "white",
    }),
    container: (base) => ({
      ...base,
      color: "white",
      background: "#1d1d1d",
      width: width,
      borderRadius: "4px",
      height: "43px",
      border: "2px solid #CECECE66",
      ...containerStyles,
      // flex: 1
    }),
    menuList: (base) => ({
      ...base,
      // kill the white space on first and last option
      padding: 0,
      margin: 0,
      background: "#1d1d1d",
      color: "white",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
    }),
    input: (base) => ({
      ...base,
      color: "white",
    }),
    menu: (base) => ({
      ...base,
      margin: 0,
      backgroundColor: "#1d1d1d",
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ 
      ...base, 
      zIndex: 9999
    }),
  };

  const SelectComponent = isCreatable ? CreatableSelect : Select;

  return (
    <SelectComponent
      placeholder={placeholder}
      className="basic-single"
      classNamePrefix="select"
      defaultValue={{ label: label ?? value, value: value }}
      value={{ label: label ?? value, value: value }}
      isDisabled={disabled}
      isClearable={isClearable}
      noOptionsMessage={() => null}
      isSearchable
      name="color"
      onChange={(item) => onChange(item, type)}
      styles={customStyles}
      options={options}
      components={{
        DropdownIndicator: () =>
          disabled ? null : (
            <ArrowDownwardIcon
              color="white"
              fontSize="12px"
              sx={{ padding: "8px" }}
            />
          ),
        IndicatorSeparator: () => null,
      }}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
    />
  );
};

export default Dropdown;
