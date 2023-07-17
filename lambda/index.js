/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

var persistenceAdapter = getPersistenceAdapter();

// i18n dependencies. i18n is the main module, sprintf allows us to include variables with '%s'.
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const languageStrings = require('./localisation');

function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'happy_birthday_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}

//Objetos con las razas caninas y su info
const { dogsFacts, dogsFactsEn } = require('./razasCaninas');

const DOCUMENT_ID1 = "HelloWorldDocument";
const DOCUMENT_ID2 = "AyudaApl";
const DOCUMENT_ID3 = "Cancelapl";
const DOCUMENT_ID4 = "error-apl";
const DOCUMENT_ID5 = "dogbuscarApl";
const DOCUMENT_ID6 = "RegistrarUsuarioDocument";


var datasource = {
    "AyudaDataSource": {
        "primaryText": "Puedes preguntarme sobre una raza por ejemplo: 'Doberman' y yo te dire informacion de el"
    },
    "ErrorDataSource": {
        "primaryText": "eu"
    },
    "HelloWorldDataSource": {
        "primaryText": "Bienvenido al conocedor de canes"
    },
    "Ayuda2DataSource": {
        "primaryText": "Puedes preguntarme sobre una raza por ejemplo: 'Doberman' y yo te dire informacion de el"
    },
    "CancelDataSource": {
        "primaryText": "Adios, Te extrañaremos <3"
    },
    "RegistroNombre": {
        "primaryText": "Puedes preguntarme sobre una raza por ejemplo: 'Doberman' y yo te dire informacion de el"
    }
};

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        const nombre = sessionAttributes['nombre'];
        
        let speechText = requestAttributes.t('WELCOME_MSG');
        
        if(nombre){
            speechText = requestAttributes.t('REGISTER_MSGINIT', nombre)
        }
        
        datasource['HelloWorldDataSource']['primaryText'] = speechText;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID1,datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const dogFactHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CustomDogIntent';
    },
    handle(handlerInput){
        const {raza} = handlerInput.requestEnvelope.request.intent.slots;
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        let response;
        
        let facts;
    
        // Verificar el idioma del usuario
        const userLocale = handlerInput.requestEnvelope.request.locale;
        if (userLocale.startsWith('en')) {
          facts = dogsFactsEn;
        } else {
          facts = dogsFacts;
        }
        
        
        if(raza && facts[raza.value]){
            response = facts[raza.value][Math.floor(Math.random() * facts[raza.value].length)];
            
            datasource['AyudaDataSource']['primaryText'] = response;
            
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = createDirectivePayload(DOCUMENT_ID5, datasource);
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
        }else{
            
            response = requestAttributes.t('NOENCONTRO1')+` ${raza.value} `+requestAttributes.t('NOENCONTRO2');
            datasource['ErrorDataSource']['primaryText'] = response;
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = createDirectivePayload(DOCUMENT_ID4, datasource);
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
        }
        
        
        return handlerInput.responseBuilder
            .speak(response)
            .reprompt(response)
            .getResponse();
    }
}

const RegisterUsuarioIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RegistrarUsuarioIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes();
        const intent = handlerInput.requestEnvelope.request.intent;

        const nombre = intent.slots.nombre.value;
        
        sessionAttributes['nombre'] = nombre;
        
        let speakout = `${requestAttributes.t('REGISTER_MSG', nombre)}.  ${requestAttributes.t('HELP_MSG')}`; 

        datasource['RegistroNombre']['primaryText'] = speakout;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID6, datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speakout)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        let speechText = requestAttributes.t('HELP_MSG');
        
        datasource['Ayuda2DataSource']['primaryText'] = speechText;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID2,datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
         // Verificar el idioma del usuario
        const userLocale = handlerInput.requestEnvelope.request.locale;
        let speechText;
        if (userLocale.startsWith('en')) {
          speechText = 'Goodbye, we will miss you <3';
        } else {
          speechText = 'Adios, Te extrañaremos <3';
        }
        
        datasource['CancelDataSource']['primaryText'] = speechText;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID3,datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        
        

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        let speechText = requestAttributes.t('ERROR_MSG');
        
        datasource['ErrorDataSource']['primaryText'] = speechText;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID4,datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    }
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
      console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};

// This request interceptor will bind a translation function 't' to the requestAttributes.
const LocalizationRequestInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true
    });
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    }
  }
};


const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};



/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        dogFactHandler,
        RegisterUsuarioIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalizationRequestInterceptor,
        LoggingRequestInterceptor,
        LoadAttributesRequestInterceptor
        )
    .addResponseInterceptors(
        LoggingResponseInterceptor,
        SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(persistenceAdapter)   
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();