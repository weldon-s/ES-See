//we define these classes to make API calls and their parameters easier
export class RequestData {
    constructor(label, url, parameters) {
        this.label = label;
        this.url = url;
        if (typeof parameters === 'undefined') {
            this.parameters = [];
        }
        else {
            this.parameters = parameters;
        }
    }

    addParameter(param) {
        return new RequestData(this.label, this.url, [...this.parameters, param]);
    }

    //TODO customizable defaults?
    getDefaultValueObject() {
        let defaultObject = {};
        this.parameters.forEach((parameter) => {
            defaultObject[parameter.name] = parameter.choices[0].value;
        })
        return defaultObject;
    }

    static getPresetParameters(params) {
        return (label, url) => {
            return new RequestData(label, url, params);
        }
    }
}

export class Parameter {
    constructor(name, label, choices, type = "default") {
        this.name = name;
        this.label = label;
        this.choices = choices;
        this.type = type;
    }

    static getParameter(name, label, array) {
        let choices = array.map((info) => {
            return new ParameterChoice(info[0], info[1]);
        })

        return new Parameter(name, label, choices);
    }

    static getBooleanParameter(name, label) {
        return new Parameter(name, label,
            [
                new ParameterChoice(true, "true"),
                new ParameterChoice(false, "false")
            ],
            "boolean"
        )
    }

    static getRangeParameter(name, label, first, last, step = 1) {
        let range = Array.from({ length: (last - first) / step + 1 }, (value, index) => first + index * step);

        let choices = range.map((value) => {
            return new ParameterChoice(value, value);
        })

        return new Parameter(name, label, choices, "range");
    }
}

class ParameterChoice {
    constructor(value, label) {
        this.value = value;
        this.label = label;
    }
}