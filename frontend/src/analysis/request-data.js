//we define these classes to make API calls and their parameters easier
class RequestData {
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

    addParameter(name, label, array) {
        let choices = array.map((info) => {
            return new ParameterChoice(info[0], info[1]);
        })

        let newParameter = new Parameter(name, label, choices);

        return new RequestData(this.label, this.url, [...this.parameters, newParameter]);
    }

    addBooleanParameter(name, label) {
        let newParameter = Parameter.getBooleanParameter(name, label);
        return new RequestData(this.label, this.url, [...this.parameters, newParameter]);
    }

    getDefaultValueObject() {
        let defaultObject = {};
        this.parameters.forEach((parameter) => {
            defaultObject[parameter.name] = parameter.choices[0].value;
        })
        return defaultObject;
    }
}

class Parameter {
    constructor(name, label, choices, type) {
        this.name = name;
        this.label = label;
        this.choices = choices;
        this.type = typeof type === 'undefined' ? 'default' : type;
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
}

class ParameterChoice {
    constructor(value, label) {
        this.value = value;
        this.label = label;
    }
}

export default RequestData;