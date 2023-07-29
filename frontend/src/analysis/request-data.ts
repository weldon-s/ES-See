//we define these classes to make API calls and their parameters easier
export class RequestData {
    label: any;
    url: string;
    parameters: Parameter[];
    decimalPlaces: number = 3;

    constructor(label: any, url: string, parameters?: Parameter[], decimalPlaces?: number) {
        this.label = label;
        this.url = url;
        this.parameters = typeof parameters === 'undefined' ? [] : parameters;
        this.decimalPlaces = typeof decimalPlaces === 'undefined' ? 3 : decimalPlaces;
    }

    addParameter(param: Parameter) {
        return new RequestData(this.label, this.url, [...this.parameters, param], this.decimalPlaces);
    }

    //TODO customizable defaults?
    //TODO customizable columns
    getValueObject(existingValues?: { [key: string]: any }) {
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

    static getPresetParameters(params: Parameter[]) {
        return (label: any, url: string, decimalPlaces?: number) => {
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

    static getParameter(name: string, label: any, array: [any, string][]) {
        let choices = array.map((info) => {
            return new ParameterChoice(info[0], info[1]);
        })

        return new Parameter(name, label, choices);
    }

    static getBooleanParameter(name: string, label: any) {
        return new Parameter(name, label,
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