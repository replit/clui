export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
};

/** Cli root */
export type Cli = {
   __typename?: 'Cli',
  /** Get weather info */
  status: Status,
  weather?: Maybe<Weather>,
};


/** Cli root */
export type CliWeatherArgs = {
  zipcode: Scalars['String'],
  view?: Maybe<Scalars['String']>,
  count?: Maybe<Scalars['Int']>,
  time?: Maybe<Scalars['Float']>,
  days?: Maybe<Array<Maybe<Scalars['String']>>>,
  hours?: Maybe<Array<Maybe<Scalars['Int']>>>,
  minutes: Array<Scalars['Float']>,
  tomorrow?: Maybe<Scalars['Boolean']>,
  today: Scalars['Boolean'],
  status?: Maybe<Status>
};

export type Root = {
   __typename?: 'Root',
  cli?: Maybe<Cli>,
};

export type Services = {
   __typename?: 'Services',
  name: Scalars['String'],
};

export enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type Weather = {
   __typename?: 'Weather',
  config?: Maybe<Scalars['String']>,
  services?: Maybe<Services>,
};
