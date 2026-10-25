// Lifts the subject out of a product photo with macOS Vision (the same model as "Copy Subject")
// and writes it as a full-frame transparent PNG (same size as the photo, so it overlays exactly).
// Usage: swift scripts/cutout.swift in.png out.png [instance indices, e.g. 1,2 — default: all]
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout in.png out.png [1,2]"); exit(1) }
let url = URL(fileURLWithPath: args[1])
guard let ci = CIImage(contentsOf: url) else { print("cannot read \(args[1])"); exit(1) }

let handler = VNImageRequestHandler(ciImage: ci)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else { print("no subject found"); exit(2) }
print("instances: \(result.allInstances.map { $0 })")
var instances = result.allInstances
if args.count >= 4 { instances = IndexSet(args[3].split(separator: ",").compactMap { Int($0) }) }
let buffer = try result.generateMaskedImage(ofInstances: instances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buffer)
let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: cs)
print("wrote \(args[2]) \(Int(out.extent.width))x\(Int(out.extent.height))")
