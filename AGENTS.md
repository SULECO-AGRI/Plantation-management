# Project Guidelines & Agent Instructions

## Coding Tasks

When spawning coding sessions or sub-agents for coding work, use the gstack skills suite for planning, review, QA, security, and shipping workflows:

- **Security audit**: Load gstack. Run `/cso`
- **Code review**: Load gstack. Run `/review`
- **QA test a URL**: Load gstack. Run `/qa https://...`
- **Build a feature end-to-end**: Load gstack. Run `/autoplan`, implement the plan, then run `/ship`
- **Plan before building**: Load gstack. Run `/office-hours` then `/autoplan`. Save the plan, don't implement.

## gstack Core Principles

### Ethos
- **Boil the Ocean**: AI makes completeness cheap, so do the complete thing: tests, edge cases, error paths. Shortcuts need an explicit, recorded decision.
- **Search Before Building**: Know what exists before deciding what to build. Don't reinvent (tried-and-true); prize first-principles insight above all.
- **User Sovereignty**: Models recommend, the user decides. Cross-model agreement is signal, never permission. Ask before changing the user's stated direction.
- **Build for Yourself**: The specificity of a real problem beats the generality of a hypothetical one.

### The Reuse Ladder
Before writing new code, stop at the first rung that holds:
1. A helper, utility, or pattern already in this repository.
2. The standard library / native platform feature.
3. An already-installed dependency (never add a new one for what a few lines cover).
4. Build the complete version of what remains.

### Voice & Style
- Direct, concrete, builder-to-builder.
- Name the file, function, command, and user-visible impact with zero filler.
