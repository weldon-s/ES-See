import { Typography } from '@mui/material';
import React, { forwardRef } from 'react';
/*
const CountryFlagCell = forwardRef(
    (props, ref) =>
    (<div {...props} ref={ref}>
        <span
            className={`fi fi-${props?.country?.code} fis`}
            style={{ borderRadius: '50%', marginRight: '5px' }}
        />
        {country?.name}
    </div>
    )
);*/

const CountryFlagCell = ({ country, fontSize }) => (
    <Typography fontSize={fontSize}>
        <span
            className={`fi fi-${country?.code} fis`}
            style={{ borderRadius: '50%', marginRight: '5px' }}
        />

        {country?.name}
    </Typography>
);

export default CountryFlagCell;