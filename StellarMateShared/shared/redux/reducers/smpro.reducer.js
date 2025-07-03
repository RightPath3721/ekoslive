/**
 * Settings of SM Pro
 **********Sample in JSON form**********
 * {
  "settings": {
    "stepper": false,
    "led": false,
    "reports": {},
    "output": {},
    "sensors": {},
    "dewHeaters": {}
  }
}
 */
const initialState =
{
    settings: {
        dewHeaters: {

        },
        sensors: {},
        output: {},
        reports: {},
        led: false,
        stepper: false
    },
};

export function smpro(state = initialState, action)
{
    switch (action.type)
    {
        default:
            {
                return state;
            }
    }
}