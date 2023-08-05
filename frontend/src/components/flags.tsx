import { Typography } from '@mui/material';
import React, { forwardRef } from 'react';

export const CountryFlagCell = forwardRef(
    //TODO make this not any
    (props: any, ref) =>
    (<Typography {...props} ref={ref}>
        <Flag code={props?.country?.code} round style={{ marginRight: "5px" }} />
        {props?.country?.name}
    </Typography>
    )
);

export const Flag = forwardRef(
    (props: any, ref) => {
        const passedStyle = props?.style ?? {};

        return <span
            {...props}
            ref={ref}
            className={`fi fi-${props.code}${props?.round || props?.square ? ' fis' : ''}`}
            style={
                props.round ?
                    {
                        borderRadius: '50%',
                        ...passedStyle
                    }
                    :
                    passedStyle
            }
        />
    });