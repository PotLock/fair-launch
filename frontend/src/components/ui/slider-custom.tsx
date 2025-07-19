import { cn } from "../../lib/utils"
import { Slider } from "./silder"

type SliderProps = React.ComponentProps<typeof Slider>
export function SliderCustom({ className, defaultValue, value, ...props }: SliderProps) {
  return (
    <Slider
      value={value}
      max={100}
      step={1}
      className={cn("[&_[data-slot=slider-track]]:bg-gray-100 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-black", className)}
      {...props}
    />
  )}