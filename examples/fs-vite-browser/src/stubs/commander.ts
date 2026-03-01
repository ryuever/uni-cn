/**
 * Stub for commander - CLI framework, not used in browser runInit/runAdd/runCreate
 */
export class Command {
  name(_name?: string) {
    return this;
  }
  option() {
    return this;
  }
  action() {
    return this;
  }
  parse() {
    return this;
  }
  description() {
    return this;
  }
  argument() {
    return this;
  }
}
export default { Command };
