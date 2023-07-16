//we define these classes to make API calls and their parameters easier
export class RequestData {
    label: any;
    url: string;
    parameters: Parameter[];
    constructor(label: any, url: string, parameters: Parameter[]) {
        this.label = label;
        this.url = url;
        if (typeof parameters === 'undefined') {
            this.parameters = [];
        }
        else {
            this.parameters = parameters;
        }
    }

    addParameter(param: Parameter) {
        return new RequestData(this.label, this.url, [...this.parameters, param]);
    }

    //TODO customizable defaults?
    getDefaultValueObject() {
        let defaultObject: { [key: string]: any } = {};
        this.parameters.forEach((parameter) => {
            defaultObject[parameter.name] = parameter.choices[0].value;
        })
        return defaultObject;
    }

    static getPresetParameters(params: Parameter[]) {
        return (label: any, url: string) => {
            return new RequestData(label, url, params);
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