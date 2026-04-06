"use client"

import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {Dispatch, SetStateAction} from "react"
import {ptBR} from "react-day-picker/locale"

export function DatePicker({date, setDate} : {date : Date | undefined, setDate : Dispatch<SetStateAction<Date | undefined>>}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          {date ? format(date, "PPP", {locale: ptBR}) : <span>Escolha uma data</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          onSelect={setDate}
          defaultMonth={date}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}
