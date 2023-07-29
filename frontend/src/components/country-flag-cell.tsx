import { Typography } from '@mui/material';
import React, { forwardRef } from 'react';

const CountryFlagCell = forwardRef(
    //TODO make this not any
    (props: any, ref) =>
    (<Typography {...props} ref={ref}>
        <span
            className={`fi fi-${props?.country?.code} fis`}
            style={{ borderRadius: '50%', marginRight: '5px' }}
        />
        {props?.country?.name}
    </Typography>
    )
);

export default CountryFlagCell;