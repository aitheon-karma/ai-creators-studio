import * as AJV from 'ajv';
import { JSONSchema7 } from 'json-schema';
import { SocketValidator } from '@aitheon/system-graph-server';

export function isSchemaObject(schema: any): boolean {
  const schemaValidator = new AJV();
  return schemaValidator.validateSchema(schema);
}

export function normalizeSchema(socketId: string, validator: SocketValidator): JSONSchema7 {
  let id = validator._id;
  if (!id.startsWith(socketId)) {
    id = `${socketId}:${id}`;
  }
  return Object.assign({}, validator.structure, {
    title: validator.name,
    $id: id
  });
}