import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { SelectInput } from "@components/Select";
import Dropdown from "@components/Dropdown";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useSelector } from "react-redux";
import { selectProfiles, selectConnected } from "@redux/selectors";
import { Palette } from "@common/shared/common/styles";
import useActiveUser from "@hooks/useActiveUser";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import s from "@common/shared/i18n/i18n";
import WarningIcon from '@mui/icons-material/Warning';

const SyncProfileDialog = ({ 
  open, 
  onClose, 
  physicalProfile, 
  onSync, 
  onCreateNew,
  observatoryId
}) => {
  const user = useActiveUser();
  const kstarsProfiles = useSelector(selectProfiles, (prev, next) => 
    JSON.stringify(prev) === JSON.stringify(next)
  );
  const [selectedKStarsProfile, setSelectedKStarsProfile] = useState("");
  const [syncOption, setSyncOption] = useState(""); // "existing" or "new" or "" (initial selection)
  const [profileEquipment, setProfileEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndiDrivers, setSelectedIndiDrivers] = useState({});
  const [matchingProfiles, setMatchingProfiles] = useState([]);
  const [exactMatchProfiles, setExactMatchProfiles] = useState([]);
  const [nameOnlyDiffProfiles, setNameOnlyDiffProfiles] = useState([]);
  const [hasIncompatibleEquipment, setHasIncompatibleEquipment] = useState(false);
  const [indiDriversInDatabase, setIndiDriversInDatabase] = useState({});
  const [allIndiDrivers, setAllIndiDrivers] = useState([]);
  const connected = useSelector(selectConnected);

  const fetchIndiDrivers = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/equipments/indi-drivers', {
        params: {
          username: user.username,
          token: user.token
        }
      });
      
      if (response.data && response.data.indiDrivers) {
        setAllIndiDrivers(response.data.indiDrivers);
      }
    } catch (error) {
      captureException(error);
      console.error("Error fetching INDI drivers:", error);
    }
  };

  // Fetch all INDI drivers when component mounts
  useEffect(() => {
    fetchIndiDrivers();
  }, [user]);

  useEffect(() => {
    if (open && kstarsProfiles && kstarsProfiles.length > 0) {
      // Prioritize exact matches, then name-only diffs, then matching profiles
      if (exactMatchProfiles.length > 0) {
        setSelectedKStarsProfile(exactMatchProfiles[0]);
      } else if (nameOnlyDiffProfiles.length > 0) {
        setSelectedKStarsProfile(nameOnlyDiffProfiles[0]);
      } else if (matchingProfiles.length > 0) {
        setSelectedKStarsProfile(matchingProfiles[0]);
      } else {
        setSelectedKStarsProfile(kstarsProfiles[0].name);
      }
    }
  }, [open, kstarsProfiles, exactMatchProfiles, nameOnlyDiffProfiles, matchingProfiles]);

  useEffect(() => {
    if (open && physicalProfile && physicalProfile._id) {
      fetchProfileEquipment(physicalProfile._id);
    }
  }, [open, physicalProfile]);

  useEffect(() => {
    if (profileEquipment && profileEquipment.length > 0) {
      const initialDriverSelections = {};
      
      // Group equipment by type
      const equipmentByType = {};
      // Track camera count for labeling
      let camerasCount = 0;
      
      profileEquipment.forEach(equipment => {
        let typeName = equipment.equipment_type?.name || "Unknown";
        
        // Special handling for cameras - label them as Camera 1, Camera 2, etc.
        if (typeName === "Camera") {
          camerasCount++;
          typeName = `Camera ${camerasCount}`;
        }
        
        if (!equipmentByType[typeName]) {
          equipmentByType[typeName] = [];
        }
        equipmentByType[typeName].push(equipment);
      });
      
      // Set initial driver selections
      Object.keys(equipmentByType).forEach(typeName => {
        const equipment = equipmentByType[typeName][0];
        const indiDrivers = Array.isArray(equipment.optional_fields?.indi_driver) 
          ? equipment.optional_fields.indi_driver 
          : [equipment.optional_fields?.indi_driver || "Unknown"];
        
        if (indiDrivers.length > 0) {
          initialDriverSelections[typeName] = indiDrivers[0];
        }
      });
      
      setSelectedIndiDrivers(initialDriverSelections);
      
      // Find matching profiles
      findMatchingProfiles(equipmentByType);
    }
  }, [profileEquipment, kstarsProfiles]);
  
  // Effect to check INDI drivers in database when KStars profile changes
  useEffect(() => {
    const checkDriversInDatabase = async () => {
      if (!user) return;
      if (syncOption === "existing" && selectedKStarsProfile) {
        const kstarsProfile = kstarsProfiles.find(p => p.name === selectedKStarsProfile);
        if (!kstarsProfile) return;
        
        // Collect all INDI drivers from the KStars profile
        const indiDrivers = [];
        Object.entries(kstarsProfile).forEach(([field, value]) => {
          // Skip non-equipment fields or empty values
          if (["name", "id", "auto_connect", "port_selector", "mode", "guiding", 
               "primary_scope", "guide_scope", "use_web_manager"].includes(field) || !value) {
            return;
          }
          
          indiDrivers.push(value);
        });
        
        if (indiDrivers.length > 0) {
          try {
            // Check if these INDI drivers exist in the database
            const response = await axios.post('/api/equipments/check-indi-drivers', {
              indiDrivers: indiDrivers
            }, {
              params: {
                username: user.username,
                token: user.token
              }
            });
            
            if (response.data && response.data.results) {
              setIndiDriversInDatabase(response.data.results);
            }
          } catch (error) {
            captureException(error);
            console.error("Error checking INDI drivers in database:", error);
          }
        }
      }
    };
    
    checkDriversInDatabase();
  }, [syncOption, selectedKStarsProfile, kstarsProfiles, user]);

  // Function to find matching profiles based on equipment INDI drivers
  const findMatchingProfiles = (equipmentByType) => {
    if (!kstarsProfiles || !equipmentByType) return;
    
    const matches = [];
    const exactMatches = [];
    const nameOnlyDiffs = [];
    
    kstarsProfiles.forEach(profile => {
      let isMatch = true;
      let allFieldsMatch = true;
      let hasEquipment = false;
      
      // Check each equipment type against profile
      Object.keys(equipmentByType).forEach(typeName => {
        const kstarsField = mapEquipmentTypeToKStarsField(typeName);
        if (!kstarsField || kstarsField === "unknown") return;
        
        hasEquipment = true;
        const equipment = equipmentByType[typeName][0];
        const indiDrivers = Array.isArray(equipment.optional_fields?.indi_driver) 
          ? equipment.optional_fields.indi_driver 
          : [equipment.optional_fields?.indi_driver || "Unknown"];
        
        // Check if profile's device is in the indi_driver array
        if (profile[kstarsField] && !indiDrivers.includes(profile[kstarsField])) {
          isMatch = false;
          allFieldsMatch = false;
        }
      });
      
      // Check if all KStars profile fields match the equipment
      if (isMatch && hasEquipment) {
        matches.push(profile.name);
        
        // If all fields match exactly, it's an exact match
        if (allFieldsMatch) {
          exactMatches.push(profile.name);
          
          // If only the name is different, add to nameOnlyDiffs
          if (profile.name !== physicalProfile?.name) {
            nameOnlyDiffs.push(profile.name);
          }
        }
      }
    });
    
    setMatchingProfiles(matches);
    setExactMatchProfiles(exactMatches);
    setNameOnlyDiffProfiles(nameOnlyDiffs);
  };

  const fetchProfileEquipment = async (profileId) => {
    if (!profileId || !user) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/equipments?profileId=${profileId}`, {
        params: {
          username: user.username,
          token: user.token
        }
      });
      
      if (response.data && response.data.equipmentList) {
        setProfileEquipment(response.data.equipmentList);
      }
    } catch (error) {
      captureException(error);
      console.error("Error fetching profile equipment:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to find the next available AUX port
  const getNextAvailableAux = (usedPorts, auxFields = ["aux1", "aux2", "aux3", "aux4"], profile = null) => {
    // If profile is provided, check directly in the profile object
    if (profile) {
      // Explicitly check each AUX port in order
      if (!profile.aux1 || profile.aux1 === "") return "aux1";
      if (!profile.aux2 || profile.aux2 === "") return "aux2";
      if (!profile.aux3 || profile.aux3 === "") return "aux3";
      if (!profile.aux4 || profile.aux4 === "") return "aux4";
    } else {
      // Otherwise use the usedPorts array
      if (!usedPorts.includes("aux1")) return "aux1";
      if (!usedPorts.includes("aux2")) return "aux2";
      if (!usedPorts.includes("aux3")) return "aux3";
      if (!usedPorts.includes("aux4")) return "aux4";
    }
    return null;
  };

  // Helper function to get a specific AUX port if available, otherwise get the next available one
  const getSpecificOrNextAux = (usedPorts, specificAux, auxFields = ["aux1", "aux2", "aux3", "aux4"], profile = null) => {
    // If profile is provided, check directly in the profile object
    if (profile) {
      if (!profile[specificAux] || profile[specificAux] === "") {
        return specificAux;
      }
      // Otherwise find the next available AUX port
      return getNextAvailableAux(usedPorts, auxFields, profile);
    } else {
      // If the specific AUX port is not used, return it
      if (!usedPorts.includes(specificAux)) {
        return specificAux;
      }
      // Otherwise find the next available AUX port
      return getNextAvailableAux(usedPorts, auxFields);
    }
  };

  const handleSync = () => {
    if (syncOption === "existing") {
      // Get the selected KStars profile
      const kstarsProfile = kstarsProfiles.find(p => p.name === selectedKStarsProfile);
      
      // Create a deep copy of the KStars profile to update
      const updatedKStarsProfile = JSON.parse(JSON.stringify(kstarsProfile));
      
      // Collect remote drivers (starting with @)
      const remoteDrivers = [];
      
      // Combine customIndiDrivers and selectedIndiDrivers to ensure all drivers are included
      const combinedDrivers = { ...selectedIndiDrivers, ...customIndiDrivers };
      
      // Track which ports are already used
      const usedPorts = [];
      
      // Force all AUX ports to be empty initially so they can be filled in order
      updatedKStarsProfile.aux1 = "";
      updatedKStarsProfile.aux2 = "";
      updatedKStarsProfile.aux3 = "";
      updatedKStarsProfile.aux4 = "";
      
      // Flag to track if we've filled AUX1
      let aux1Filled = false;
      
      // Find the first device that can go to AUX1
      let aux1Device = null;
      Object.keys(combinedDrivers).forEach(typeName => {
        const driverValue = combinedDrivers[typeName];
        // Skip empty driver values and remote drivers
        if (!driverValue || driverValue === "--" || driverValue.startsWith('@')) return;
        
        // Skip devices that have specific mappings
        const originalTypeName = typeName.startsWith("Camera ") ? "Camera" : typeName;
        if (originalTypeName === "Camera" || originalTypeName === "Mount" || 
            originalTypeName === "Focuser" || originalTypeName === "Filter Wheel" || 
            originalTypeName === "Dome" || originalTypeName === "Adaptive Optic" || 
            originalTypeName === "Weather Station" || originalTypeName === "Guider") return;
        
        // If we haven't found an AUX1 device yet, use this one
        if (!aux1Device) {
          aux1Device = { typeName, driverValue };
        }
      });
      
      // If we found a device for AUX1, assign it
      if (aux1Device) {
        updatedKStarsProfile.aux1 = aux1Device.driverValue;
        usedPorts.push("aux1");
        aux1Filled = true;
        // Remove this device from combinedDrivers so we don't process it again
        delete combinedDrivers[aux1Device.typeName];
      }
      
      // First pass: Identify which ports are already in use in the profile
      // We need to know this before assigning new devices
      Object.entries(updatedKStarsProfile).forEach(([field, value]) => {
        // Skip non-equipment fields or empty values
        if (["name", "id", "auto_connect", "port_selector", "mode", "guiding", 
             "primary_scope", "guide_scope", "use_web_manager", "remote"].includes(field) || !value || value === "--") {
          return;
        }
        
        // Add this port to the used ports list
        usedPorts.push(field);
      });
      
      // Update the profile with the selected INDI drivers
      Object.keys(combinedDrivers).forEach(typeName => {
        // Get the original type name (for Camera 1, Camera 2, etc.)
        let originalTypeName = typeName;
        // If it's Camera 1, Camera 2, etc., convert it to Camera for processing
        if (typeName.startsWith("Camera ")) {
          originalTypeName = "Camera";
        }
        
        const driverValue = combinedDrivers[typeName];
        
        // Skip empty driver values
        if (!driverValue || driverValue === "--") return;
        
        // Handle remote drivers (starting with @)
        if (driverValue.startsWith('@')) {
          remoteDrivers.push(driverValue);
          
          // Set the corresponding category field to "--"
          const kstarsField = mapEquipmentTypeToKStarsField(typeName);
          if (kstarsField && kstarsField !== "unknown") {
            updatedKStarsProfile[kstarsField] = "--";
          }
          
          return;
        }
        
        // Special handling for Camera type
        if (originalTypeName === "Camera") {
          // If it's Camera 1, Camera 2, etc., use the specific camera number
          if (typeName.startsWith("Camera ")) {
            const cameraNumber = parseInt(typeName.split(" ")[1]);
            if (cameraNumber === 1) {
              // First camera goes to ccd
              updatedKStarsProfile.ccd = driverValue;
              if (!usedPorts.includes("ccd")) usedPorts.push("ccd");
            } else if (cameraNumber === 2) {
              // Second camera goes to guider
              updatedKStarsProfile.guider = driverValue;
              if (!usedPorts.includes("guider")) usedPorts.push("guider");
            } else {
              // For Camera 3 and beyond, use aux1 if available, otherwise find the next available AUX port
              console.log(`Before assignment for ${typeName}:`, {
                aux1: updatedKStarsProfile.aux1,
                aux2: updatedKStarsProfile.aux2,
                aux3: updatedKStarsProfile.aux3,
                aux4: updatedKStarsProfile.aux4,
                usedPorts
              });
              
              // Explicitly check each AUX port in order
              let auxPort = null;
              if (!updatedKStarsProfile.aux1 || updatedKStarsProfile.aux1 === "") {
                auxPort = "aux1";
              } else if (!updatedKStarsProfile.aux2 || updatedKStarsProfile.aux2 === "") {
                auxPort = "aux2";
              } else if (!updatedKStarsProfile.aux3 || updatedKStarsProfile.aux3 === "") {
                auxPort = "aux3";
              } else if (!updatedKStarsProfile.aux4 || updatedKStarsProfile.aux4 === "") {
                auxPort = "aux4";
              }
              
              if (auxPort) {
                console.log(`Assigning ${typeName} to ${auxPort}`);
                updatedKStarsProfile[auxPort] = driverValue;
                usedPorts.push(auxPort);
              } else {
                console.warn(`No available AUX port for ${typeName}`);
              }
              
              console.log(`After assignment for ${typeName}:`, {
                aux1: updatedKStarsProfile.aux1,
                aux2: updatedKStarsProfile.aux2,
                aux3: updatedKStarsProfile.aux3,
                aux4: updatedKStarsProfile.aux4,
                usedPorts
              });
            }
          } else {
            // For backward compatibility with just "Camera"
            // First camera goes to ccd
            if (!updatedKStarsProfile.ccd || updatedKStarsProfile.ccd === "") {
              updatedKStarsProfile.ccd = driverValue;
              if (!usedPorts.includes("ccd")) usedPorts.push("ccd");
            } 
            // Second camera goes to guider
            else if (!updatedKStarsProfile.guider || updatedKStarsProfile.guider === "") {
              updatedKStarsProfile.guider = driverValue;
              if (!usedPorts.includes("guider")) usedPorts.push("guider");
            } 
            // For additional cameras, use aux1 if available, otherwise find the next available AUX port
            else {
              const auxPort = getSpecificOrNextAux(usedPorts, "aux1", ["aux1", "aux2", "aux3", "aux4"], updatedKStarsProfile);
              if (auxPort) {
                updatedKStarsProfile[auxPort] = driverValue;
                usedPorts.push(auxPort);
              } else {
                console.warn(`No available AUX port for Camera`);
              }
            }
          }
        } 
        // For other local drivers, update the corresponding field
        else {
          const kstarsField = mapEquipmentTypeToKStarsField(typeName);
          
          // If it's a specific field (not AUX), assign directly
          if (kstarsField && kstarsField !== "unknown" && !kstarsField.startsWith("aux")) {
            updatedKStarsProfile[kstarsField] = driverValue;
            if (!usedPorts.includes(kstarsField)) usedPorts.push(kstarsField);
          } 
          // For devices that map to AUX (like Rotator, Dust Cap, etc.), use the specific AUX port if available
          else if (kstarsField && kstarsField.startsWith("aux")) {
            // Use the specific AUX port if available, otherwise get the next available one
            const auxPort = getSpecificOrNextAux(usedPorts, kstarsField, ["aux1", "aux2", "aux3", "aux4"], updatedKStarsProfile);
            if (auxPort) {
              updatedKStarsProfile[auxPort] = driverValue;
              usedPorts.push(auxPort);
            } else {
              console.warn(`No available AUX port for ${typeName}`);
            }
          }
        }
      });
      
      // Add remote drivers to the remote field as a comma-separated list
      if (remoteDrivers.length > 0) {
        updatedKStarsProfile.remote = remoteDrivers.join(',');
      }
      
      // Update the physical profile
      const updatedPhysicalProfile = {
        ...physicalProfile,
        name: updatedKStarsProfile.name,
        isSynced: true
      };
      
      // Call onSync with the updated profiles
      onSync(updatedPhysicalProfile, updatedKStarsProfile);
    } else {
      handleConfirmCreate();
    }
    
    onClose();
  };
  
  const handleConfirmCreate = () => {
    // Start with default settings
    const mappedProfile = {
      name: physicalProfile?.name, // Always use observatory profile name
      mount: "",
      ccd: "",
      guider: "",
      focuser: "",
      filter: "",
      ao: "",
      dome: "",
      weather: "",
      aux1: "",
      aux2: "",
      aux3: "",
      aux4: "",
      remote: "", // Field for remote drivers
      auto_connect: true,
      port_selector: true,
      mode: "local",
      guiding: 0,
      primary_scope: 0,
      guide_scope: 0,
      use_web_manager: true
    };
    
    // Explicitly ensure all AUX ports are empty initially
    mappedProfile.aux1 = "";
    mappedProfile.aux2 = "";
    mappedProfile.aux3 = "";
    mappedProfile.aux4 = "";
    
    // Flag to track if we've filled AUX1
    let aux1Filled = false;
    
    // Create collections for each category
    const concreteTypes = {
      Mount: "mount",
      Camera: "ccd", // First camera goes to ccd
      Guider: "guider", // Second camera (or guider) goes to guider
      Focuser: "focuser",
      "Filter Wheel": "filter",
      "Adaptive Optic": "ao",
      Dome: "dome",
      "Weather Station": "weather"
    };
    
    const auxiliaryFields = ["aux1", "aux2", "aux3", "aux4"];
    
    // Track which ports are already used
    const usedPorts = [];
    
    // Track if we've already assigned cameras
    let cameraCount = 0;
    
    // Collect remote drivers
    const remoteDrivers = [];
    
    // Combine customIndiDrivers and selectedIndiDrivers to ensure all drivers are included
    const combinedDrivers = { ...selectedIndiDrivers, ...customIndiDrivers };
    
    // Find the first device that can go to AUX1
    let aux1Device = null;
    Object.keys(combinedDrivers).forEach(typeName => {
      const driverValue = combinedDrivers[typeName];
      // Skip empty driver values and remote drivers
      if (!driverValue || driverValue === "--" || driverValue.startsWith('@')) return;
      
      // Skip devices that have specific mappings
      const originalTypeName = typeName.startsWith("Camera ") ? "Camera" : typeName;
      if (originalTypeName === "Camera" || typeName in concreteTypes) return;
      
      // If we haven't found an AUX1 device yet, use this one
      if (!aux1Device) {
        aux1Device = { typeName, driverValue };
      }
    });
    
    // If we found a device for AUX1, assign it
    if (aux1Device) {
      mappedProfile.aux1 = aux1Device.driverValue;
      usedPorts.push("aux1");
      aux1Filled = true;
      // Remove this device from combinedDrivers so we don't process it again
      delete combinedDrivers[aux1Device.typeName];
    }
    
    // Process remaining drivers
    Object.keys(combinedDrivers).forEach(typeName => {
      // Get the original type name (for Camera 1, Camera 2, etc.)
      let originalTypeName = typeName;
      // If it's Camera 1, Camera 2, etc., convert it to Camera for processing
      if (typeName.startsWith("Camera ")) {
        originalTypeName = "Camera";
      }
      
      const driverValue = combinedDrivers[typeName];
      
      // Skip empty driver values
      if (!driverValue || driverValue === "--") return;
      
      // Collect remote drivers for later processing
      if (driverValue.startsWith('@')) {
        remoteDrivers.push(driverValue);
        
        // Set the corresponding category field to "--"
        if (typeName in concreteTypes) {
          const fieldName = concreteTypes[typeName];
          mappedProfile[fieldName] = "--";
        }
        
        return;
      }
      
      // Special handling for Camera type
      if (originalTypeName === "Camera") {
        // If it's Camera 1, Camera 2, etc., use the specific camera number
        if (typeName.startsWith("Camera ")) {
          const cameraNumber = parseInt(typeName.split(" ")[1]);
          if (cameraNumber === 1) {
            // First camera goes to ccd
            mappedProfile.ccd = driverValue;
            usedPorts.push("ccd");
          } else if (cameraNumber === 2) {
            // Second camera goes to guider
            mappedProfile.guider = driverValue;
            usedPorts.push("guider");
          } else {
            // For Camera 3 and beyond, use aux1 if available, otherwise find the next available AUX port
            const auxPort = getSpecificOrNextAux(usedPorts, "aux1", auxiliaryFields, mappedProfile);
            if (auxPort) {
              mappedProfile[auxPort] = driverValue;
              usedPorts.push(auxPort);
            } else {
              console.warn(`No available AUX port for ${typeName}`);
            }
          }
        } else {
          // For backward compatibility with just "Camera"
          cameraCount++;
          
          if (cameraCount === 1) {
            // First camera goes to ccd
            mappedProfile.ccd = driverValue;
            usedPorts.push("ccd");
          } else if (cameraCount === 2) {
            // Second camera goes to guider
            mappedProfile.guider = driverValue;
            usedPorts.push("guider");
          } else {
            // For additional cameras, use aux1 if available, otherwise find the next available AUX port
            const auxPort = getSpecificOrNextAux(usedPorts, "aux1", auxiliaryFields, mappedProfile);
            if (auxPort) {
              mappedProfile[auxPort] = driverValue;
              usedPorts.push(auxPort);
            } else {
              console.warn(`No available AUX port for Camera`);
            }
          }
        }
      } 
      // Handle other concrete types
      else if (typeName in concreteTypes) {
        const fieldName = concreteTypes[typeName];
        mappedProfile[fieldName] = driverValue;
        usedPorts.push(fieldName);
      } 
      // For any other equipment type, assign to auxiliary
      else {
        // Get the suggested AUX port from the mapping
        const suggestedField = mapEquipmentTypeToKStarsField(typeName);
        
        // Use the specific AUX port if available, otherwise get the next available one
        if (suggestedField && suggestedField.startsWith("aux")) {
          const auxPort = getSpecificOrNextAux(usedPorts, suggestedField, auxiliaryFields, mappedProfile);
          if (auxPort) {
            mappedProfile[auxPort] = driverValue;
            usedPorts.push(auxPort);
          } else {
            console.warn(`No available AUX port for ${typeName}`);
          }
        }
        // If no specific AUX port is suggested, try aux1 first, then find the next available one
        else {
          const auxPort = getSpecificOrNextAux(usedPorts, "aux1", auxiliaryFields, mappedProfile);
          if (auxPort) {
            mappedProfile[auxPort] = driverValue;
            usedPorts.push(auxPort);
          } else {
            console.warn(`No available AUX port for ${typeName}`);
          }
        }
      }
    });
    
    // Add remote drivers to the remote field as a comma-separated list
    if (remoteDrivers.length > 0) {
      mappedProfile.remote = remoteDrivers.join(',');
    }
    
    // Update the physical profile with the KStar profile name and mark it as synced
    const updatedPhysicalProfile = {
      ...physicalProfile,
      name: mappedProfile.name,
      isSynced: true
    };
    
    onCreateNew(mappedProfile);
    onSync(updatedPhysicalProfile, mappedProfile);
  };

  const handleCancel = () => {
    setSyncOption("");
    onClose();
  };
  
  const handleSyncOptionSelect = (option) => {
    setSyncOption(option);
  };
  
  const handleBack = () => {
    setSyncOption("");
    setHasIncompatibleEquipment(false);
  };
  
  // Map equipment type to KStars profile field
  const mapEquipmentTypeToKStarsField = (equipmentType) => {
    // Handle Camera 1, Camera 2, etc.
    if (equipmentType.startsWith("Camera ")) {
      const cameraNumber = parseInt(equipmentType.split(" ")[1]);
      if (cameraNumber === 1) return "ccd";
      if (cameraNumber === 2) return "guider";
      // Camera 3 and beyond will be dynamically assigned to available AUX ports
      return "aux"; // This will be handled by getNextAvailableAux
    }
    
    const typeNameMapping = {
      "Mount": "mount",
      "Telescope / Lense": "telescope",
      "Camera": "ccd", // For backward compatibility
      "Focuser": "focuser",
      "Filter Wheel": "filter",
      "Dome": "dome",
      "Adaptive Optic": "ao",
      "Weather Station": "weather",
      "Rotator": "aux1",
      "Dust Cap": "aux2",
      "Light Box": "aux3",
      "Auxiliary": "aux4",
      "Guider": "guider"
    };
    
    return typeNameMapping[equipmentType] || "unknown";
  };

  // Add this function near the other helper functions
  const shouldShowInTable = (equipmentType) => {
    const excludedTypes = ["Telescope / Lense", "Filter", "Barlow", "Reducer"];
    return !excludedTypes.includes(equipmentType);
  };

  // State to track custom INDI driver values
  const [customIndiDrivers, setCustomIndiDrivers] = useState({});
  
  // Update the generateComparisonRows function
  const generateComparisonRows = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={syncOption === "existing" ? 4 : 3} align="center">
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {s.splash.loading}
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    
    if (!profileEquipment || profileEquipment.length === 0 && syncOption !== "existing") {
      return (
        <TableRow>
          <TableCell colSpan={syncOption === "existing" ? 4 : 3} align="center">
            <Typography variant="body2">
              {s.connect.observatory.no_equipment_found}
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    
    // Group equipment by type
    const equipmentByType = {};
    // Track camera count for labeling
    let camerasCount = 0;
    
    profileEquipment.forEach(equipment => {
      let typeName = equipment.equipment_type?.name || "Unknown";
      
      // Special handling for cameras - label them as Camera 1, Camera 2, etc.
      if (typeName === "Camera") {
        camerasCount++;
        typeName = `Camera ${camerasCount}`;
      }
      
      // Only add equipment types that should be shown
      if (shouldShowInTable(typeName)) {
        if (!equipmentByType[typeName]) {
          equipmentByType[typeName] = [];
        }
        equipmentByType[typeName].push(equipment);
      }
    });
    
    // Create rows for each equipment type
    const rows = [];
    let hasIncompatible = false;
    
    if (syncOption === "existing" && selectedKStarsProfile) {
      const kstarsProfile = kstarsProfiles.find(p => p.name === selectedKStarsProfile);
      if (kstarsProfile) {
        // Create a map of all equipment types that should be displayed
        const allEquipmentTypes = new Map();
        
        // First, add all observatory equipment types
        Object.keys(equipmentByType).forEach(typeName => {
          if (shouldShowInTable(typeName)) {
            allEquipmentTypes.set(typeName, {
              hasObservatory: true,
              hasKStars: false,
              kstarsValue: ""
            });
          }
        });
        
        // Create a reverse mapping from KStars fields to equipment types
        const fieldToTypeMap = {};
        const typeNameMapping = {
          "Mount": "mount",
          "Telescope / Lense": "telescope",
          "Camera": "ccd",
          "Focuser": "focuser",
          "Filter Wheel": "filter",
          "Dome": "dome",
          "Adaptive Optic": "ao",
          "Weather Station": "weather",
          "Rotator": "aux1",
          "Dust Cap": "aux2",
          "Light Box": "aux3",
          "Auxiliary": "aux4",
          "Guider": "guider"
        };
        
        Object.entries(typeNameMapping).forEach(([type, field]) => {
          if (field !== "unknown") {
            fieldToTypeMap[field] = type;
          }
        });
        
        // Then check KStars profile fields
        Object.entries(kstarsProfile).forEach(([field, value]) => {
          // Skip non-equipment fields or empty values
          if (["name", "id", "auto_connect", "port_selector", "mode", "guiding", 
               "primary_scope", "guide_scope", "use_web_manager"].includes(field) || !value) {
            return;
          }
          
          // Get the equipment type for this field
          const equipmentType = fieldToTypeMap[field];
          
          if (equipmentType && shouldShowInTable(equipmentType)) {
            if (allEquipmentTypes.has(equipmentType)) {
              // Update existing entry
              const entry = allEquipmentTypes.get(equipmentType);
              entry.hasKStars = true;
              entry.kstarsValue = value;
            } else {
              // Add new entry for KStars-only equipment
              allEquipmentTypes.set(equipmentType, {
                hasObservatory: false,
                hasKStars: true,
                kstarsValue: value
              });
            }
          }
        });
        
        // Only create rows for observatory equipment types
        Object.keys(equipmentByType).forEach(typeName => {
          if (shouldShowInTable(typeName)) {
            const equipment = equipmentByType[typeName][0];
            const model = equipment.label || equipment.model || "Unknown";
            const indiDrivers = Array.isArray(equipment.optional_fields?.indi_driver) 
              ? equipment.optional_fields.indi_driver 
              : [equipment.optional_fields?.indi_driver || "Unknown"];
            
            // Get KStars value if it exists
            let kstarsValue = "";
            if (kstarsProfile) {
              const kstarsField = mapEquipmentTypeToKStarsField(typeName);
              if (kstarsField && kstarsField !== "unknown" && kstarsProfile[kstarsField]) {
                kstarsValue = kstarsProfile[kstarsField];
              }
            }
            
            // Check if there's an INDI driver for this equipment
            const hasIndiDriver = indiDrivers[0] && indiDrivers[0] !== "Unknown";
            
            rows.push(
              <TableRow key={typeName}>
                <TableCell sx={{color: Palette.white}}>{typeName}</TableCell>
                <TableCell sx={{color: Palette.white}}>{model}</TableCell>
                <TableCell sx={{color: Palette.white}}>
                  {!hasIndiDriver && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WarningIcon sx={{ color: '#ff9800', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#ff9800' }}>
                        No INDI driver specified
                      </Typography>
                    </Box>
                  )}
                  <Dropdown
                    value={customIndiDrivers[typeName] || (indiDrivers[0] || "Unknown")}
                    options={allIndiDrivers.length > 0 
                      ? allIndiDrivers.map(driver => ({ label: driver, value: driver }))
                      : indiDrivers.map(driver => ({ label: driver, value: driver }))
                    }
                    width="100%"
                    onChange={(item) => {
                      // Update the custom INDI drivers state
                      setCustomIndiDrivers(prev => ({
                        ...prev,
                        [typeName]: item.value
                      }));
                      
                      // Also update selectedIndiDrivers for consistency
                      setSelectedIndiDrivers(prev => ({
                        ...prev,
                        [typeName]: item.value
                      }));
                    }}
                    isCreatable={true}
                    placeholder="Select or enter INDI driver"
                  />
                </TableCell>
              </TableRow>
            );
          }
        });
      }
    } else {
      // For new KStars profile, just show observatory equipment
      Object.keys(equipmentByType).forEach(typeName => {
        if (shouldShowInTable(typeName)) {
          const equipment = equipmentByType[typeName][0]; // Take the first equipment of each type
          const model = equipment.label || equipment.model || "Unknown";
          
          // Get INDI driver information
          const indiDrivers = Array.isArray(equipment.optional_fields?.indi_driver) 
            ? equipment.optional_fields.indi_driver 
            : [equipment.optional_fields?.indi_driver || "Unknown"];
          
          // Use the first INDI driver if it's an array
          const indiDriver = indiDrivers[0] || "Unknown";
          
          // Check if there's an INDI driver for this equipment
          const hasIndiDriver = indiDriver && indiDriver !== "Unknown";
          
          rows.push(
            <TableRow key={typeName}>
              <TableCell sx={{color: Palette.white}}>{typeName}</TableCell>
              <TableCell sx={{color: Palette.white}}>{model}</TableCell>
              <TableCell sx={{color: Palette.white}}>
                {!hasIndiDriver && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: '#ff9800' }}>
                      No INDI driver specified
                    </Typography>
                  </Box>
                )}
                <Dropdown
                  value={customIndiDrivers[typeName] || (indiDrivers[0] || "Unknown")}
                  options={allIndiDrivers.length > 0 
                    ? allIndiDrivers.map(driver => ({ label: driver, value: driver }))
                    : indiDrivers.map(driver => ({ label: driver, value: driver }))
                  }
                  width="100%"
                  onChange={(item) => {
                    // Update the custom INDI drivers state
                    setCustomIndiDrivers(prev => ({
                      ...prev,
                      [typeName]: item.value
                    }));
                    
                    // Also update selectedIndiDrivers for consistency
                    setSelectedIndiDrivers(prev => ({
                      ...prev,
                      [typeName]: item.value
                    }));
                  }}
                  isCreatable={true}
                  placeholder="Select or enter INDI driver"
                />
              </TableCell>
            </TableRow>
          );
        }
      });
    }
    
    // Update incompatible equipment state
    if (hasIncompatible !== hasIncompatibleEquipment) {
      setHasIncompatibleEquipment(hasIncompatible);
    }
    
    return rows;
  };
  
  // Render the option selection screen
  const renderOptionSelection = () => {
    // If profile is already synced, show message and don't display sync options
    if (physicalProfile?.isSynced) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid #4caf50' }}>
            <Typography variant="body1" sx={{ color: '#4caf50' }}>
              {s.connect.observatory.synchronized_profile}
            </Typography>
          </Box>
        </Box>
      );
    }

    // Show warning if not connected to KStars
    if (!connected) {
      return (
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'rgba(255, 0, 0, 0.1)', 
            borderRadius: 1, 
            border: '1px solid #ff0000',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <WarningIcon sx={{ color: '#ff0000' }} />
            <Typography variant="body1" sx={{ color: Palette.white }}>
              {s.connect.observatory.not_connected_to_kstars}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                  bgcolor: 'rgba(30, 30, 30, 0.5)'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: Palette.white }}>
                  {"Select Existing Profile"}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                  bgcolor: 'rgba(30, 30, 30, 0.5)'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: Palette.white }}>
                  {"Create New Profile"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }
    
    // Otherwise show sync options
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255, 102, 0, 0.1)',
                  transform: 'translateY(-5px)'
                },
                bgcolor: 'rgba(30, 30, 30, 0.5)'
              }}
              onClick={() => handleSyncOptionSelect("existing")}
            >
              <Typography variant="h6" sx={{ mb: 2, color: Palette.white }}>
                {"Select Existing Profile"}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255, 102, 0, 0.1)',
                  transform: 'translateY(-5px)'
                },
                bgcolor: 'rgba(30, 30, 30, 0.5)'
              }}
              onClick={() => handleSyncOptionSelect("new")}
            >
              <Typography variant="h6" sx={{ mb: 2, color: Palette.white }}>
                {"Create New Profile"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render the comparison table screen
  const renderComparisonTable = () => {
    return (
      <Box sx={{ minWidth: 800, mt: 2 }}>
        {syncOption === "existing" && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {s.connect.observatory.select_kstars_profile}
            </Typography>
            <Select
              value={selectedKStarsProfile}
              onChange={(e) => setSelectedKStarsProfile(e.target.value)}
              size="small"
              fullWidth
              sx={{ 
                color: Palette.white,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: Palette.white,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: Palette.orange,
                },
                '.MuiSvgIcon-root': {
                  color: Palette.white,
                }
              }}
            >
              {kstarsProfiles?.map((profile) => (
                <MenuItem key={profile.name} value={profile.name}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
        {hasIncompatibleEquipment && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(255, 0, 0, 0.1)', borderRadius: 1, border: '1px solid #ff0000' }}>
            <Typography variant="body2" sx={{ color: Palette.white }}>
              {s.connect.observatory.warning_equipment_mismatch}
            </Typography>
          </Box>
        )}
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{color: Palette.orange}}>{s.general.type}</TableCell>
              <TableCell sx={{color: Palette.orange}}>{s.tabs.device}</TableCell>
              <TableCell sx={{color: Palette.orange}}>{s.connect.observatory.indi_driver}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {generateComparisonRows()}
          </TableBody>
        </Table>
      </Box>
    );
  };
  
  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="lg">
      <DialogTitle>
        {syncOption !== "" && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              onClick={handleBack}
              startIcon={<span>←</span>}
              sx={{ mr: 2 }}
            >
              {s.general.back}
            </Button>
            <Typography variant="h6">Sync Profile</Typography>
          </Box>
        )}
        {syncOption === "" && "Sync Profile"}
      </DialogTitle>
      <DialogContent>
        {syncOption === "" ? renderOptionSelection() : renderComparisonTable()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{s.general.cancel}</Button>
        {syncOption !== "" && (
          <Button 
            onClick={handleSync} 
            variant="contained" 
            sx={{ backgroundColor: Palette.orange }}
            disabled={(syncOption === "existing" && !selectedKStarsProfile) || hasIncompatibleEquipment}
          >
            {syncOption === "existing" 
              ? "Sync" 
              : "Create & Sync"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SyncProfileDialog;
