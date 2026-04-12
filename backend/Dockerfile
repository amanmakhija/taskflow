# Build stage
FROM golang:1.25 AS builder
WORKDIR /app
COPY . .
RUN go mod tidy
RUN go build -o main cmd/api/main.go

# Run stage
FROM gcr.io/distroless/base-debian11
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]