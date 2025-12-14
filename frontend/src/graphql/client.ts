import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
import { getToken } from "../utils/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const httpLink = new UploadHttpLink({
  uri: `${API_BASE_URL}/graphql`,
  credentials: "include",
});

const authLink = setContext((operation, { headers }) => {
  const token = getToken();
  const operationName = operation.operationName ?? "unknown";
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "x-apollo-operation-name": operationName,
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
