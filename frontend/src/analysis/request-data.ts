import Client from "../api/client";

//we define these classes to make API calls and their parameters easier
//TODO reset button for parameters

type choicesToNumber = (choices: { [key: string]: any }) => number;

export class RequestData {
    label: any;
    url: string;
    parameters: Parameter[];
    private decimalPlaces: choicesToNumber;
    private choices: { [key: string]: any } = {}; //TODO make other fields private?

    constructor(label: any, url: string, parameters?: Parameter[], decimalPlaces?: choicesToNumber | number) {
        this.label = label;
        this.url = url;
        this.parameters = typeof parameters === "undefined" ? [] : parameters;

        if (typeof decimalPlaces === "undefined") {
            this.decimalPlaces = () => 3;
        }
        else if (typeof decimalPlaces === "number") {
            this.decimalPlaces = () => decimalPlaces;
        }
        else {
            this.decimalPlaces = decimalPlaces;
        }

        this.choices = this.getValueObject();
    }

    //TODO customizable defaults?
    //TODO customizable columns
    private getValueObject(existingValues?: { [key: string]: any }) {
        //We'll see if we have any parameters matching the names of the parameters in this object
        //If so, if the existing value for said parameter is valid (i.e. in the list of choices for this object), we'll just use that value

        let valueObject: { [key: string]: any } = {};

        this.parameters.forEach((parameter) => {
            if (existingValues && Object.keys(existingValues).includes(parameter.name)) {
                valueObject[parameter.name] = existingValues[parameter.name];
            }
            else if (parameter.choices.length > 0) {
                valueObject[parameter.name] = parameter.choices[0].value;
            }
            else {
                valueObject[parameter.name] = "";
            }
        })

        return valueObject;
    }

    addParameter(param: Parameter) {
        return new RequestData(this.label, this.url, [...this.parameters, param], this.decimalPlaces);
    }

    getChoice(key: string) {
        return this.choices[key];
    }

    setChoice(key: string, value: any) {
        const param = this.parameters.find((param) => param.name === key);

        if (!param) {
            return; //error?
        }

        if (param.choices.some((choice) => choice.value === value)) {
            this.choices[key] = value;
        }
    }

    getDecimalPlaces() {
        return this.decimalPlaces(this.choices);
    }

    request() {
        //we return a promise so that the caller can do something with the response
        return new Promise((resolve, reject) => {
            Client.post(this.url, this.choices)
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        })
    }

    static getPresetParameters(params: Parameter[]) {
        return (label: any, url: string, decimalPlaces?: choicesToNumber | number) => {
            return new RequestData(label, url, params, decimalPlaces);
        }
    }
}

export class Parameter {
    name: string;
    label: any;
    choices: ParameterChoice[];
    type: string;
    private constructor(name: string, label: any, choices: ParameterChoice[], type: string = "default") {
        this.name = name;
        this.label = label;
        this.choices = choices;
        this.type = type;
    }

    static getParameter(name: string, label: any, array: ([any, string] | string)[]) {
        const choices = array.map((info) => {
            if (typeof info === "string") {
                const label = info.charAt(0).toUpperCase() + info.slice(1);
                return new ParameterChoice(info, label);
            }

            return new ParameterChoice(info[0], info[1]);
        })

        return new Parameter(name, label, choices);
    }

    static getBooleanParameter(name: string, label?: any) {
        const defaultLabel = name.charAt(0).toUpperCase() + name.slice(1) + "?";

        return new Parameter(name, typeof label === "undefined" ? defaultLabel : label,
            [
                new ParameterChoice(true, "true"),
                new ParameterChoice(false, "false")
            ],
            "boolean"
        )
    }

    static getRangeParameter(name: string, label: any, first: number, last: number, step: number = 1) {
        let range = Array.from({ length: (last - first) / step + 1 }, (value, index) => first + index * step);

        let choices = range.map((value) => {
            return new ParameterChoice(value, value);
        })

        return new Parameter(name, label, choices, "range");
    }
}

class ParameterChoice {
    value: any;
    label: any;

    constructor(value: any, label: any) {
        this.value = value;
        this.label = label;
    }
}