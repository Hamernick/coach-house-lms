"use client"

import type { ReactNode } from "react"
import { CalendarBlank, CaretDown, User } from "@phosphor-icons/react/dist/ssr"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { MemberWorkspacePersonOption } from "../../types"

export const headerChipIconClassName = "h-3.5 w-3.5 shrink-0 opacity-80"

const headerChipClassName =
  "h-7 min-w-0 max-w-[18rem] rounded-full border-transparent bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 shadow-none dark:bg-zinc-600/20 dark:text-zinc-50"

function findOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? value
}

function normalizeMemberName(value: string) {
  return value.trim().toLowerCase()
}

export function parseHeaderChipList(value: string) {
  const seen = new Set<string>()
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) return false
      const key = normalizeMemberName(entry)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function formatMemberLabels(names: string[]) {
  return names.join(", ")
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function formatMemberSummary(names: string[]) {
  if (names.length === 0) return "Assign people"
  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(" + ")
  return `${names[0]} + ${names.length - 1}`
}

export function HeaderMetaChip({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        headerChipClassName,
        "inline-flex w-fit items-center justify-center gap-1.5 leading-none",
        className
      )}
    >
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </Badge>
  )
}

export function SelectChip({
  id,
  label,
  leadingIcon,
  options,
  triggerClassName,
  value,
  onChange,
}: {
  id: string
  label: string
  leadingIcon?: ReactNode
  options: ReadonlyArray<{ value: string; label: string }>
  triggerClassName?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          headerChipClassName,
          "w-fit gap-2 border-none pr-2.5 leading-none [&>svg]:ml-0.5 [&>svg]:h-3.5 [&>svg]:w-3.5",
          triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {leadingIcon}
          <SelectValue placeholder={findOptionLabel(options, value)} />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function DateChip({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label
      className={cn(
        headerChipClassName,
        "inline-flex w-fit items-center gap-1.5 border leading-none"
      )}
    >
      <CalendarBlank className={headerChipIconClassName} aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <Input
        id={id}
        type="date"
        value={value}
        className="h-auto w-[8.5rem] border-0 bg-transparent px-0 py-0 text-base shadow-none focus-visible:ring-0 sm:text-xs"
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  )
}

export function MembersAssignmentMenu({
  assigneeOptions,
  id,
  value,
  onChange,
}: {
  assigneeOptions: MemberWorkspacePersonOption[]
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const selectedNames = parseHeaderChipList(value)
  const selectedNameSet = new Set(selectedNames.map(normalizeMemberName))
  const hasOptions = assigneeOptions.length > 0

  const updateNames = (names: string[]) => {
    onChange(formatMemberLabels(names))
  }

  const togglePerson = (personName: string) => {
    const normalizedName = normalizeMemberName(personName)
    if (selectedNameSet.has(normalizedName)) {
      updateNames(
        selectedNames.filter(
          (name) => normalizeMemberName(name) !== normalizedName
        )
      )
      return
    }

    updateNames([...selectedNames, personName])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            headerChipClassName,
            "justify-start gap-1.5 pr-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-600/30"
          )}
        >
          <User className={headerChipIconClassName} aria-hidden />
          <span className="truncate">{formatMemberSummary(selectedNames)}</span>
          <CaretDown className="ml-0.5 h-3.5 w-3.5 opacity-70" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span>Assigned people</span>
          <span className="text-muted-foreground text-xs font-normal">
            {selectedNames.length} selected
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {hasOptions ? (
            assigneeOptions.map((person) => (
              <DropdownMenuCheckboxItem
                key={person.id}
                checked={selectedNameSet.has(normalizeMemberName(person.name))}
                onCheckedChange={() => togglePerson(person.name)}
                onSelect={(event) => event.preventDefault()}
              >
                <Avatar className="size-6">
                  {person.avatarUrl ? (
                    <AvatarImage src={person.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {getInitials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{person.name}</span>
                  {person.email ? (
                    <span className="text-muted-foreground truncate text-xs">
                      {person.email}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              No people are available to assign.
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!hasOptions}
            onSelect={(event) => {
              event.preventDefault()
              updateNames(assigneeOptions.map((person) => person.name))
            }}
          >
            Assign all
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={selectedNames.length === 0}
            onSelect={(event) => {
              event.preventDefault()
              updateNames([])
            }}
          >
            Remove all
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={!hasOptions || selectedNames.length === 0}
            >
              Transfer to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuGroup>
                {assigneeOptions.map((person) => (
                  <DropdownMenuItem
                    key={person.id}
                    onSelect={(event) => {
                      event.preventDefault()
                      updateNames([person.name])
                    }}
                  >
                    <Avatar className="size-6">
                      {person.avatarUrl ? (
                        <AvatarImage src={person.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{person.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
