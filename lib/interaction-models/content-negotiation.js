/*
 * Copyright 2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const mediaTypeNegotiator = require('negotiator/lib/mediaType');
const querystring = require('querystring');
const Cloudevent = require("cloudevents-sdk")
const CloudeventsUnmarshaller = require("cloudevents-sdk/http/unmarshaller/v02")
var cloudeventsUnmarshaller = new CloudeventsUnmarshaller();
const SUPPORTED_MEDIA_TYPES = ['text/plain', 'application/octet-stream', 'application/json', 'application/x-www-form-urlencoded', 'application/cloudevents+json']; // In preference order

const mediaTypeMarshallers = {
    'application/octet-stream': {
        unmarshall: async (buffer) => await Promise.resolve(buffer),
        marshall: async (any) => await Promise.resolve(Buffer.from(any))
    },
    'text/plain': {
        unmarshall: async (buffer) => await Promise.resolve('' + buffer),
        marshall: async (string) => await Promise.resolve(Buffer.from('' + string))// await Promise.resolve(Buffer.from('' + string))
    },
    'application/json': {
        unmarshall: async (buffer) => await Promise.resolve(JSON.parse('' + buffer)),
        marshall: async (object) => await Promise.resolve(Buffer.from(JSON.stringify(object)))
    },
    'application/x-www-form-urlencoded': {
        unmarshall: async (buffer) => await Promise.resolve(querystring.parse('' + buffer)),
        marshall: async (object) => await Promise.resolve(Buffer.from(querystring.stringify(object)))
    },
    'application/cloudevents+json': {
        unmarshall: async (buffer) => await cloudeventsUnmarshaller.unmarshall(buffer + '', {'Content-Type': 'application/cloudevents+json'}),
        marshall: async (object) => {
            if (!(object instanceof Cloudevent)) {
                throw 'Expected Cloudevent'
            }
            return await Promise.resolve(Buffer.from(object.toString()))
        }
    }
};

function canMarshall(type) {
    return !!marshaller(type);
}

function marshaller(type) {
    const { marshall } = mediaTypeMarshallers[type] || {};
    return marshall;
}

function canUnmarshall(type) {
    return !!unmarshaller(type);
}

function unmarshaller(type) {
    const { unmarshall } = mediaTypeMarshallers[type] || {};
    return unmarshall;
}

function determineContentTypes(contentType, accept) {
    // TODO correctly handle content-type charset, instead of ignoring it
    contentType = (contentType || 'text/plain').split(';')[0].trim();
    accept = accept || contentType;
    const accepted = mediaTypeNegotiator(accept, SUPPORTED_MEDIA_TYPES)[0];
    return { contentType, accept: accepted };
}

module.exports = {
    canMarshall,
    canUnmarshall,
    marshaller,
    unmarshaller,
    determineContentTypes
};
