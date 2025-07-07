import { cn } from "../../lib/utils"
import { Slider } from "./silder"

type SliderProps = React.ComponentProps<typeof Slider>
export function SliderCustom({ className, ...props }: SliderProps) {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className={cn("[&_[data-slot=slider-track]]:bg-gray-100 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-black", className)}
      {...props}
    />
  )}