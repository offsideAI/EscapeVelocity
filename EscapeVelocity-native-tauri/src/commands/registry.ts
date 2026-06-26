/** Central action registry. Clean-room — modeled on the common editor pattern
 *  of (id -> command) lookup feeding both a palette and a keymap, not ported
 *  from any specific editor's source. See THIRD_PARTY.md. */
import type { Command } from "./types";

const commands = new Map<string, Command>();

export function registerCommand(cmd: Command): void {
  commands.set(cmd.id, cmd);
}

export function registerCommands(cmds: Command[]): void {
  cmds.forEach(registerCommand);
}

export function getCommand(id: string): Command | undefined {
  return commands.get(id);
}

export function allCommands(): Command[] {
  return [...commands.values()];
}

export function runCommand(id: string): void {
  const cmd = commands.get(id);
  if (!cmd) {
    console.warn(`[commands] unknown command: ${id}`);
    return;
  }
  if (cmd.isEnabled && !cmd.isEnabled()) return;
  cmd.run();
}
