export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
};

export type Query = {
   __typename?: 'Query',
  root?: Maybe<Scalars['String']>,
};

/** 
 * One possible value for a given Enum. Enum values are unique values, not a
 * placeholder for a string or numeric value. However an Enum value is returned in
 * a JSON response as a string.
 */
export type __EnumValue = {
   __typename?: '__EnumValue',
  name: Scalars['String'],
  description?: Maybe<Scalars['String']>,
  isDeprecated: Scalars['Boolean'],
  deprecationReason?: Maybe<Scalars['String']>,
};

/** 
 * Object and Interface types are described by a list of Fields, each of which has
 * a name, potentially a list of arguments, and a return type.
 */
export type __Field = {
   __typename?: '__Field',
  name: Scalars['String'],
  description?: Maybe<Scalars['String']>,
  args: Array<__InputValue>,
  type: __Type,
  isDeprecated: Scalars['Boolean'],
  deprecationReason?: Maybe<Scalars['String']>,
};

/** 
 * Arguments provided to Fields or Directives and the input fields of an
 * InputObject are represented as Input Values which describe their type and
 * optionally a default value.
 */
export type __InputValue = {
   __typename?: '__InputValue',
  name: Scalars['String'],
  description?: Maybe<Scalars['String']>,
  type: __Type,
  /** A GraphQL-formatted string representing the default value for this input value. */
  defaultValue?: Maybe<Scalars['String']>,
};

/** 
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of
 * types in GraphQL as represented by the `__TypeKind` enum.
 * 
 * Depending on the kind of a type, certain fields describe information about that
 * type. Scalar types provide no information beyond a name and description, while
 * Enum types provide their values. Object and Interface types provide the fields
 * they describe. Abstract types, Union and Interface, provide the Object types
 * possible at runtime. List and NonNull types compose other types.
 */
export type __Type = {
   __typename?: '__Type',
  kind: __TypeKind,
  name?: Maybe<Scalars['String']>,
  description?: Maybe<Scalars['String']>,
  fields?: Maybe<Array<__Field>>,
  interfaces?: Maybe<Array<__Type>>,
  possibleTypes?: Maybe<Array<__Type>>,
  enumValues?: Maybe<Array<__EnumValue>>,
  inputFields?: Maybe<Array<__InputValue>>,
  ofType?: Maybe<__Type>,
};


/** 
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of
 * types in GraphQL as represented by the `__TypeKind` enum.
 * 
 * Depending on the kind of a type, certain fields describe information about that
 * type. Scalar types provide no information beyond a name and description, while
 * Enum types provide their values. Object and Interface types provide the fields
 * they describe. Abstract types, Union and Interface, provide the Object types
 * possible at runtime. List and NonNull types compose other types.
 */
export type __TypeFieldsArgs = {
  includeDeprecated?: Maybe<Scalars['Boolean']>
};


/** 
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of
 * types in GraphQL as represented by the `__TypeKind` enum.
 * 
 * Depending on the kind of a type, certain fields describe information about that
 * type. Scalar types provide no information beyond a name and description, while
 * Enum types provide their values. Object and Interface types provide the fields
 * they describe. Abstract types, Union and Interface, provide the Object types
 * possible at runtime. List and NonNull types compose other types.
 */
export type __TypeEnumValuesArgs = {
  includeDeprecated?: Maybe<Scalars['Boolean']>
};

/** An enum describing what kind of type a given `__Type` is. */
export enum __TypeKind {
  /** Indicates this type is a scalar. */
  Scalar = 'SCALAR',
  /** Indicates this type is an object. `fields` and `interfaces` are valid fields. */
  Object = 'OBJECT',
  /** Indicates this type is an interface. `fields` and `possibleTypes` are valid fields. */
  Interface = 'INTERFACE',
  /** Indicates this type is a union. `possibleTypes` is a valid field. */
  Union = 'UNION',
  /** Indicates this type is an enum. `enumValues` is a valid field. */
  Enum = 'ENUM',
  /** Indicates this type is an input object. `inputFields` is a valid field. */
  InputObject = 'INPUT_OBJECT',
  /** Indicates this type is a list. `ofType` is a valid field. */
  List = 'LIST',
  /** Indicates this type is a non-null. `ofType` is a valid field. */
  NonNull = 'NON_NULL'
}
