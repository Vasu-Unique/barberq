# Smart Salon Queue Management System

## 1. Project Overview

A simple digital queue system for barber shops and salons. It helps
customers avoid crowded waiting areas and helps barbers manage walk-in
customers in an organized way.

## 2. Problem

-   Salons can become crowded during busy hours.
-   Customers do not know how long they will have to wait.
-   Some customers get frustrated and leave without receiving a service.
-   Barbers may find it difficult to manage the queue manually.

## 3. Proposed Solution

Build an app that gives each customer a unique token number and shows
their live position in the queue. The app estimates the waiting time and
sends notifications when the customer's turn is approaching.

## 4. How It Works

1.  Customer selects a salon.
2.  Customer joins the queue and receives a token number.
3.  The app shows the customer's position and the number of people
    ahead.
4.  The app displays an estimated waiting time.
5.  As the queue moves, the position and estimated time update.
6.  The customer receives alerts when their turn is approaching.
7.  When it is their turn, the customer goes to the salon for the
    service.

## 5. Example

If a customer receives token **04**, three customers are ahead of them.

-   3 people ahead: show the estimated waiting time.
-   2 people ahead: send an approaching-turn notification.
-   1 person ahead: send a "You're next" notification.
-   Customer's turn: ask them to come to the barber.

*Waiting times are estimates and should update as the queue changes.*

## 6. Main Features

### Customer App

-   Select a salon.
-   Join the queue and get a digital token.
-   View live queue position.
-   See estimated waiting time.
-   Receive turn notifications.
-   Cancel a token if plans change.

### Barber / Salon Dashboard

-   View the customer queue.
-   Call the next token.
-   Mark a service as started or completed.
-   Update or remove a token when needed.
-   View the number of waiting customers.

## 7. Project Goal

Reduce unnecessary waiting and overcrowding, improve the customer
experience, and make queue management easier for barbers.

## 8. Future Improvements

-   Remote token booking.
-   Multiple barbers and service selection.
-   More accurate waiting-time estimates based on service duration.
-   Customer feedback and visit history.
