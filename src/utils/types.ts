export interface RestOptions {
  endpoint: string,
  method?: string,
  header?: HeaderOption[] | HeaderOption,
  data?: DataOptions,
}
interface DataOptions {
  payload: any
  method: "form" | "json"
}

interface HeaderOption {
  key: string,
  value: string
}