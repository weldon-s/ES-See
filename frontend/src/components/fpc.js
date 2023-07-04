import Client from "../api/client.js"
import {getYear} from "../data/index.js"

Client.post("entries/add_all/", {
    entries: getYear("2022").songs,
    year: 2022
})
