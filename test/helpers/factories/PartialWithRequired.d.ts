// inverse of omit
export type PartialWithRequired<T, K extends keyof T> = Pick<T, K> &
    Partial<Omit<T, K>>;
