import React, { useContext, useEffect, useState } from 'react';

import { CountryContext } from "../app"
import Client from '../api/client';

const QualifyingHistoryView = () => {
    const [data, setData] = useState(undefined)
    const [year, setYear] = useState(2023)

    const countries = useContext(CountryContext);


    useEffect(() => {
        if (countries) {
            Client.post("qualify/get_qualifiers/", {

            })
                .then(res => {
                    setData({
                        "qualifiers": res.data.qualifiers.map(elem => countries.find(country => country.id === elem)),
                        "non_qualifiers": res.data.non_qualifiers.map(elem => countries.find(country => country.id === elem))
                    })
                })
        }
    }, [countries])

    useEffect(() => {
        console.log(qs)
    }, [qs])

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center">Qualifying History</Typography>
        </Container>
    );
}

export default QualifyingHistoryView;