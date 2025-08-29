import { useLoaderData } from "react-router";

export type SerializeFromLoader<T> = ReturnType<typeof useLoaderData<T>>;
