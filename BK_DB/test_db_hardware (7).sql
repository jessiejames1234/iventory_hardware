-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 28, 2025 at 04:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test_db_hardware`
--

-- --------------------------------------------------------

--
-- Table structure for table `brand`
--

CREATE TABLE `brand` (
  `brand_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brand`
--

INSERT INTO `brand` (`brand_id`, `name`) VALUES
(3, 'Intel'),
(4, 'NVIDIA');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `name`) VALUES
(4, 'Processor'),
(5, 'Graphics Card');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `product_id`, `warehouse_id`, `quantity`) VALUES
(1, 35, 3, 119),
(3, 35, 2, 2),
(4, 35, 1, 2),
(5, 35, 4, 2),
(6, 29, 4, 2),
(7, 34, 7, 48),
(8, 34, 6, 5),
(9, 35, 7, 77),
(28, 33, 7, 2);

-- --------------------------------------------------------

--
-- Table structure for table `pos_terminal`
--

CREATE TABLE `pos_terminal` (
  `terminal_id` int(11) NOT NULL,
  `terminal_name` varchar(100) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pos_terminal`
--

INSERT INTO `pos_terminal` (`terminal_id`, `terminal_name`, `status`) VALUES
(1, '2', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `product_name` varchar(50) NOT NULL,
  `model` varchar(100) NOT NULL,
  `specs` text NOT NULL,
  `img` varchar(1000) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reorder_level` int(11) NOT NULL,
  `warranty_period` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `category_id`, `brand_id`, `unit_id`, `product_name`, `model`, `specs`, `img`, `cost_price`, `selling_price`, `quantity`, `reorder_level`, `warranty_period`, `is_active`, `created_by`, `created_at`, `updated_at`, `updated_by`) VALUES
(29, 4, 3, 1, 'dsaddasd', 'dsas', 'dsa', '', 312.00, 12312.00, 0, 1, 'dsa', 0, 1, '2025-08-14 03:49:47', '2025-08-14 04:43:10', 1),
(30, 4, 3, NULL, 'ds', '11', 'ewq', '', 11.00, 11.00, 0, 0, '', 1, 1, '2025-08-14 04:29:23', '2025-08-14 05:30:19', 1),
(31, 4, 3, NULL, 'das', 'dsa', 'dsad', '', 1.00, 11.00, 0, 12, '1', 1, 1, '2025-08-14 16:46:03', NULL, NULL),
(32, 4, 3, 2, 'dsa', 'da', 'dsa', '', 3.00, 12.00, 0, 1231, 'sa', 1, 1, '2025-08-14 16:46:14', NULL, NULL),
(33, 4, 3, NULL, '31', '213', '123', '', 312.00, 12.00, 2, 321, '123', 1, 1, '2025-08-14 16:46:20', NULL, NULL),
(34, 5, 4, 1, 'NVIDIA RTX Graphics Card', '900-1G136', '12 GB GDDR6X', '', 4000.00, 5000.00, 24, 2, '5Years', 1, 1, '2025-08-14 16:46:27', '2025-08-15 10:28:53', 1),
(35, 4, 3, 1, 'Intel Core i7 Processor', 'BX8071513700K', '16 cores\n24 threads', '', 3890.00, 4500.00, 29, 2, '5years', 0, 1, '2025-08-14 17:58:21', '2025-08-15 10:26:07', 1),
(36, 4, 3, 1, 'Test_Product', '2312', 'dasd', '', 22.00, 22.00, 0, 2, '231', 1, 9, '2025-08-28 04:12:09', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_supplier`
--

CREATE TABLE `product_supplier` (
  `product_supplier_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_supplier`
--

INSERT INTO `product_supplier` (`product_supplier_id`, `product_id`, `supplier_id`) VALUES
(1, 33, 4),
(2, 29, 3),
(3, 29, 3),
(4, 30, 4),
(5, 29, 4),
(6, 35, 3),
(7, 33, 5),
(8, 35, 7),
(9, 34, 3);

-- --------------------------------------------------------

--
-- Table structure for table `salesreturn`
--

CREATE TABLE `salesreturn` (
  `return_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `return_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reason` varchar(255) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salestransaction`
--

CREATE TABLE `salestransaction` (
  `transaction_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `terminal_id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift`
--

CREATE TABLE `shift` (
  `shift_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shift`
--

INSERT INTO `shift` (`shift_id`, `staff_id`, `start_time`, `end_time`) VALUES
(1, 1, '2025-08-06 09:49:54', '2025-08-06 09:49:54'),
(2, 1, '2025-08-06 09:50:15', '2025-08-06 09:50:15'),
(3, 1, '2025-08-06 09:54:45', '2025-08-06 09:54:45'),
(4, 1, '2025-08-06 09:55:10', '2025-08-06 09:55:10'),
(5, 1, '2025-08-06 09:57:18', '2025-08-06 09:57:18'),
(6, 1, '2025-08-06 09:59:48', '2025-08-06 09:59:48'),
(7, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(8, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(9, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(10, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(11, 1, '2025-08-06 09:59:55', '2025-08-06 09:59:55'),
(12, 1, '2025-08-06 09:59:55', '2025-08-06 09:59:55'),
(13, 1, '2025-08-06 10:00:00', '2025-08-06 10:00:00'),
(14, 1, '2025-08-06 10:00:09', '2025-08-06 10:00:09'),
(15, 1, '2025-08-06 10:00:32', '2025-08-06 10:00:32'),
(16, 1, '2025-08-06 10:00:52', '2025-08-06 10:00:52'),
(17, 1, '2025-08-06 10:03:30', '2025-08-06 10:03:30'),
(18, 2, '2025-08-06 10:03:57', '2025-08-06 10:03:57'),
(19, 1, '2025-08-06 10:07:49', '2025-08-06 10:09:48'),
(20, 1, '2025-08-06 10:09:59', '2025-08-06 10:10:23'),
(21, 1, '2025-08-06 10:10:26', NULL),
(22, 1, '2025-08-10 14:35:40', NULL),
(23, 1, '2025-08-10 14:37:15', NULL),
(24, 1, '2025-08-10 14:58:11', '2025-08-10 15:08:30'),
(25, 2, '2025-08-10 15:08:59', NULL),
(26, 2, '2025-08-10 15:16:37', '2025-08-10 15:33:54'),
(27, 1, '2025-08-10 15:33:59', '2025-08-10 16:05:35'),
(28, 1, '2025-08-10 15:40:04', '2025-08-10 16:04:37'),
(29, 2, '2025-08-10 16:04:42', '2025-08-10 16:05:17'),
(30, 1, '2025-08-10 16:05:23', '2025-08-10 16:05:28'),
(31, 2, '2025-08-10 16:05:41', NULL),
(32, 1, '2025-08-12 02:53:49', NULL),
(33, 1, '2025-08-12 03:46:27', '2025-08-12 03:48:16'),
(34, 2, '2025-08-12 03:48:29', NULL),
(35, 1, '2025-08-12 14:02:30', '2025-08-12 15:00:02'),
(36, 1, '2025-08-12 15:00:07', '2025-08-12 16:49:05'),
(37, 1, '2025-08-12 16:50:15', '2025-08-12 16:50:19'),
(38, 1, '2025-08-12 16:51:20', NULL),
(39, 1, '2025-08-13 18:38:25', '2025-08-14 03:56:16'),
(40, 1, '2025-08-14 03:56:25', NULL),
(41, 1, '2025-08-14 04:06:52', NULL),
(42, 1, '2025-08-14 04:23:58', '2025-08-14 04:24:44'),
(43, 2, '2025-08-14 04:24:50', '2025-08-14 04:25:41'),
(44, 1, '2025-08-14 04:25:57', '2025-08-14 05:13:46'),
(45, 1, '2025-08-14 05:13:56', '2025-08-14 05:41:53'),
(46, 1, '2025-08-14 05:42:07', '2025-08-14 06:15:23'),
(47, 1, '2025-08-14 06:15:30', NULL),
(48, 1, '2025-08-14 12:26:03', '2025-08-14 12:43:54'),
(49, 1, '2025-08-14 12:43:58', '2025-08-14 12:44:02'),
(50, 1, '2025-08-14 12:44:07', '2025-08-14 16:01:40'),
(51, 1, '2025-08-14 16:01:44', '2025-08-14 16:05:49'),
(52, 1, '2025-08-14 16:05:53', '2025-08-14 16:23:53'),
(53, 1, '2025-08-14 16:23:57', '2025-08-14 16:37:06'),
(54, 1, '2025-08-14 16:37:09', NULL),
(55, 1, '2025-08-14 16:37:22', NULL),
(56, 1, '2025-08-14 16:39:08', '2025-08-14 17:13:17'),
(57, 1, '2025-08-14 17:13:22', NULL),
(58, 1, '2025-08-14 17:20:43', NULL),
(59, 1, '2025-08-14 18:17:21', '2025-08-14 18:28:14'),
(60, 1, '2025-08-14 18:28:18', '2025-08-14 18:37:25'),
(61, 1, '2025-08-14 18:37:30', '2025-08-14 18:38:02'),
(62, 1, '2025-08-14 18:38:05', '2025-08-14 18:41:23'),
(63, 1, '2025-08-14 18:41:27', NULL),
(64, 1, '2025-08-14 18:41:39', '2025-08-14 18:50:31'),
(65, 1, '2025-08-14 19:06:39', '2025-08-14 19:08:23'),
(66, 1, '2025-08-14 19:08:27', '2025-08-14 19:10:41'),
(67, 1, '2025-08-14 19:10:46', NULL),
(68, 1, '2025-08-14 19:23:07', '2025-08-14 19:23:14'),
(69, 1, '2025-08-14 19:23:20', '2025-08-14 19:29:53'),
(70, 1, '2025-08-14 19:29:57', NULL),
(71, 1, '2025-08-14 23:24:26', NULL),
(72, 1, '2025-08-14 23:43:31', '2025-08-14 23:50:37'),
(73, 1, '2025-08-14 23:50:54', '2025-08-14 23:59:17'),
(74, 1, '2025-08-14 23:59:20', NULL),
(75, 1, '2025-08-15 00:14:42', '2025-08-15 00:17:20'),
(76, 1, '2025-08-15 00:17:32', '2025-08-15 00:19:26'),
(77, 1, '2025-08-15 00:19:37', NULL),
(78, 1, '2025-08-15 00:22:30', NULL),
(79, 1, '2025-08-15 00:30:32', '2025-08-15 00:34:51'),
(80, 1, '2025-08-15 00:35:02', '2025-08-15 00:39:11'),
(81, 1, '2025-08-15 00:41:21', NULL),
(82, 1, '2025-08-15 00:44:04', '2025-08-15 00:53:45'),
(83, 1, '2025-08-15 00:53:59', NULL),
(84, 1, '2025-08-15 00:55:01', NULL),
(85, 1, '2025-08-15 00:56:54', NULL),
(86, 1, '2025-08-15 00:57:34', NULL),
(87, 1, '2025-08-15 01:07:45', NULL),
(88, 1, '2025-08-15 01:13:41', NULL),
(89, 1, '2025-08-15 01:14:17', NULL),
(90, 1, '2025-08-15 01:15:28', NULL),
(91, 1, '2025-08-15 01:20:08', NULL),
(92, 1, '2025-08-15 01:20:52', NULL),
(93, 1, '2025-08-15 07:16:49', '2025-08-15 07:17:15'),
(94, 1, '2025-08-15 07:17:19', '2025-08-15 07:18:28'),
(95, 1, '2025-08-15 07:18:58', '2025-08-15 07:20:06'),
(96, 1, '2025-08-15 07:21:07', '2025-08-15 07:22:09'),
(97, 2, '2025-08-15 07:25:06', NULL),
(98, 1, '2025-08-15 07:27:10', NULL),
(99, 2, '2025-08-15 07:27:22', NULL),
(100, 1, '2025-08-15 07:29:21', '2025-08-15 07:41:17'),
(101, 1, '2025-08-15 07:41:52', NULL),
(102, 1, '2025-08-15 07:43:51', NULL),
(103, 1, '2025-08-15 07:54:11', '2025-08-15 07:54:16'),
(104, 1, '2025-08-15 07:57:27', NULL),
(105, 1, '2025-08-15 08:04:02', NULL),
(106, 1, '2025-08-15 08:42:36', '2025-08-15 08:45:33'),
(107, 1, '2025-08-15 10:12:11', '2025-08-15 10:43:32'),
(108, 1, '2025-08-15 10:43:43', NULL),
(109, 1, '2025-08-16 01:02:01', '2025-08-16 01:11:50'),
(110, 9, '2025-08-16 01:12:00', '2025-08-16 01:12:04'),
(111, 9, '2025-08-16 01:12:09', '2025-08-16 01:13:35'),
(112, 13, '2025-08-16 01:13:36', NULL),
(113, 9, '2025-08-25 08:10:51', NULL),
(114, 9, '2025-08-25 08:11:15', NULL),
(115, 9, '2025-08-25 08:35:29', NULL),
(116, 9, '2025-08-25 08:37:02', NULL),
(117, 9, '2025-08-25 08:44:56', '2025-08-28 14:14:58'),
(118, 9, '2025-08-25 08:46:58', '2025-08-25 09:08:17'),
(119, 9, '2025-08-25 09:08:31', '2025-08-25 09:08:41'),
(120, 9, '2025-08-25 09:08:55', '2025-08-25 09:09:21'),
(121, 9, '2025-08-25 09:13:42', '2025-08-25 09:14:18'),
(122, 19, '2025-08-25 09:14:22', '2025-08-25 09:14:27'),
(123, 19, '2025-08-25 09:14:34', '2025-08-25 09:15:22'),
(124, 9, '2025-08-25 09:15:33', '2025-08-28 14:12:26'),
(125, 9, '2025-08-25 09:21:49', '2025-08-25 09:22:54'),
(126, 23, '2025-08-25 09:22:58', NULL),
(127, 9, '2025-08-25 09:48:31', '2025-08-28 14:10:21'),
(128, 9, '2025-08-25 13:44:02', '2025-08-28 13:43:43'),
(129, 9, '2025-08-25 13:45:51', '2025-08-28 13:24:10'),
(130, 9, '2025-08-27 05:31:10', '2025-08-28 13:23:16'),
(131, 9, '2025-08-27 05:34:21', '2025-08-27 06:09:23'),
(132, 9, '2025-08-27 05:47:59', '2025-08-27 05:50:09'),
(133, 24, '2025-08-27 05:50:19', NULL),
(134, 24, '2025-08-27 05:50:20', NULL),
(135, 24, '2025-08-27 05:50:21', NULL),
(136, 24, '2025-08-27 05:50:24', NULL),
(137, 24, '2025-08-27 05:51:28', NULL),
(138, 24, '2025-08-27 05:51:29', NULL),
(139, 24, '2025-08-27 05:51:41', NULL),
(140, 24, '2025-08-27 05:51:41', NULL),
(141, 24, '2025-08-27 05:55:15', NULL),
(142, 24, '2025-08-27 05:55:15', NULL),
(143, 24, '2025-08-27 05:55:15', NULL),
(144, 24, '2025-08-27 05:55:16', NULL),
(145, 24, '2025-08-27 05:55:24', NULL),
(146, 24, '2025-08-27 05:55:27', NULL),
(147, 24, '2025-08-27 05:55:27', NULL),
(148, 24, '2025-08-27 05:55:28', NULL),
(149, 24, '2025-08-27 05:55:28', NULL),
(150, 24, '2025-08-27 05:55:28', NULL),
(151, 24, '2025-08-27 05:56:41', NULL),
(152, 24, '2025-08-27 05:56:41', NULL),
(153, 24, '2025-08-27 05:56:42', NULL),
(154, 24, '2025-08-27 05:56:42', NULL),
(155, 24, '2025-08-27 05:56:42', NULL),
(156, 24, '2025-08-27 05:59:00', NULL),
(157, 24, '2025-08-27 05:59:01', NULL),
(158, 24, '2025-08-27 05:59:01', NULL),
(159, 24, '2025-08-27 05:59:01', NULL),
(160, 24, '2025-08-27 05:59:01', NULL),
(161, 24, '2025-08-27 05:59:02', NULL),
(162, 24, '2025-08-27 05:59:02', NULL),
(163, 24, '2025-08-27 05:59:17', NULL),
(164, 24, '2025-08-27 06:01:24', NULL),
(165, 24, '2025-08-27 06:01:25', NULL),
(166, 24, '2025-08-27 06:01:30', NULL),
(167, 24, '2025-08-27 06:01:30', NULL),
(168, 24, '2025-08-27 06:01:30', NULL),
(169, 24, '2025-08-27 06:01:30', NULL),
(170, 24, '2025-08-27 06:01:30', NULL),
(171, 24, '2025-08-27 06:04:46', NULL),
(172, 24, '2025-08-27 06:04:47', NULL),
(173, 24, '2025-08-27 06:04:47', NULL),
(174, 24, '2025-08-27 06:04:47', NULL),
(175, 24, '2025-08-27 06:04:48', NULL),
(176, 24, '2025-08-27 06:04:48', NULL),
(177, 24, '2025-08-27 06:04:48', NULL),
(178, 24, '2025-08-27 06:04:48', NULL),
(179, 24, '2025-08-27 06:04:48', NULL),
(180, 24, '2025-08-27 06:04:49', NULL),
(181, 24, '2025-08-27 06:04:49', NULL),
(182, 24, '2025-08-27 06:04:49', NULL),
(183, 24, '2025-08-27 06:04:49', NULL),
(184, 24, '2025-08-27 06:04:50', NULL),
(185, 24, '2025-08-27 06:04:50', NULL),
(186, 24, '2025-08-27 06:04:50', NULL),
(187, 24, '2025-08-27 06:04:50', NULL),
(188, 24, '2025-08-27 06:04:50', NULL),
(189, 24, '2025-08-27 06:04:51', NULL),
(190, 24, '2025-08-27 06:04:51', NULL),
(191, 24, '2025-08-27 06:04:51', NULL),
(192, 24, '2025-08-27 06:04:51', NULL),
(193, 24, '2025-08-27 06:04:51', NULL),
(194, 24, '2025-08-27 06:04:52', NULL),
(195, 24, '2025-08-27 06:04:52', NULL),
(196, 24, '2025-08-27 06:04:52', NULL),
(197, 24, '2025-08-27 06:04:52', NULL),
(198, 24, '2025-08-27 06:04:52', NULL),
(199, 24, '2025-08-27 06:04:53', NULL),
(200, 24, '2025-08-27 06:04:53', NULL),
(201, 24, '2025-08-27 06:04:53', NULL),
(202, 9, '2025-08-27 06:09:25', '2025-08-27 06:09:28'),
(203, 9, '2025-08-27 06:09:48', '2025-08-27 06:14:21'),
(204, 24, '2025-08-27 06:09:56', NULL),
(205, 24, '2025-08-27 06:09:58', NULL),
(206, 24, '2025-08-27 06:09:58', NULL),
(207, 24, '2025-08-27 06:09:58', NULL),
(208, 24, '2025-08-27 06:09:58', NULL),
(209, 24, '2025-08-27 06:09:59', NULL),
(210, 24, '2025-08-27 06:09:59', NULL),
(211, 24, '2025-08-27 06:09:59', NULL),
(212, 24, '2025-08-27 06:09:59', NULL),
(213, 24, '2025-08-27 06:09:59', NULL),
(214, 24, '2025-08-27 06:10:00', NULL),
(215, 24, '2025-08-27 06:10:00', NULL),
(216, 24, '2025-08-27 06:10:00', NULL),
(217, 24, '2025-08-27 06:10:01', NULL),
(218, 24, '2025-08-27 06:10:01', NULL),
(219, 24, '2025-08-27 06:10:01', NULL),
(220, 24, '2025-08-27 06:10:02', NULL),
(221, 24, '2025-08-27 06:10:02', NULL),
(222, 24, '2025-08-27 06:10:02', NULL),
(223, 24, '2025-08-27 06:10:02', NULL),
(224, 24, '2025-08-27 06:10:02', NULL),
(225, 24, '2025-08-27 06:14:24', NULL),
(226, 24, '2025-08-27 06:14:24', NULL),
(227, 24, '2025-08-27 06:14:24', NULL),
(228, 24, '2025-08-27 06:14:25', NULL),
(229, 9, '2025-08-27 06:20:30', '2025-08-27 07:48:05'),
(230, 24, '2025-08-27 06:20:37', NULL),
(231, 24, '2025-08-27 06:21:55', NULL),
(232, 24, '2025-08-27 06:22:11', NULL),
(233, 24, '2025-08-27 06:29:22', NULL),
(234, 25, '2025-08-27 06:29:51', NULL),
(235, 24, '2025-08-27 06:33:19', NULL),
(236, 24, '2025-08-27 06:37:42', NULL),
(237, 24, '2025-08-27 06:41:07', '2025-08-28 12:51:19'),
(238, 24, '2025-08-27 06:47:23', '2025-08-28 12:50:49'),
(239, 24, '2025-08-27 06:52:54', '2025-08-27 07:11:36'),
(240, 9, '2025-08-27 06:55:02', '2025-08-27 06:55:04'),
(241, 24, '2025-08-27 06:55:09', '2025-08-27 06:59:20'),
(242, 9, '2025-08-27 06:59:24', '2025-08-27 06:59:34'),
(243, 25, '2025-08-27 06:59:43', '2025-08-27 07:06:52'),
(244, 9, '2025-08-27 07:07:03', '2025-08-27 07:10:48'),
(245, 9, '2025-08-27 07:13:17', '2025-08-27 07:30:43'),
(246, 27, '2025-08-27 07:13:50', '2025-08-27 07:17:12'),
(247, 27, '2025-08-27 07:17:38', '2025-08-27 07:17:55'),
(248, 26, '2025-08-27 07:17:59', '2025-08-27 07:20:02'),
(249, 9, '2025-08-27 07:30:46', '2025-08-27 07:31:20'),
(250, 9, '2025-08-27 07:31:50', '2025-08-27 07:39:21'),
(251, 27, '2025-08-27 07:39:28', NULL),
(252, 27, '2025-08-27 07:39:28', NULL),
(253, 27, '2025-08-27 07:39:29', NULL),
(254, 27, '2025-08-27 07:39:29', NULL),
(255, 27, '2025-08-27 07:39:30', NULL),
(256, 27, '2025-08-27 07:39:30', NULL),
(257, 27, '2025-08-27 07:39:30', NULL),
(258, 27, '2025-08-27 07:39:31', NULL),
(259, 27, '2025-08-27 07:39:31', NULL),
(260, 27, '2025-08-27 07:39:31', NULL),
(261, 27, '2025-08-27 07:39:40', NULL),
(262, 28, '2025-08-27 07:48:07', '2025-08-27 07:51:04'),
(263, 28, '2025-08-27 07:51:10', '2025-08-27 07:56:49'),
(264, 9, '2025-08-27 07:57:04', '2025-08-27 08:01:49'),
(265, 28, '2025-08-27 08:02:00', '2025-08-27 08:02:05'),
(266, 9, '2025-08-27 08:02:11', '2025-08-28 13:23:08'),
(267, 27, '2025-08-27 08:58:19', NULL),
(268, 9, '2025-08-27 09:26:44', '2025-08-28 13:19:40'),
(269, 9, '2025-08-27 09:27:23', '2025-08-28 13:19:29'),
(270, 9, '2025-08-27 09:37:22', '2025-08-28 13:18:39'),
(271, 9, '2025-08-27 09:43:02', '2025-08-28 13:18:32'),
(272, 9, '2025-08-27 10:02:11', '2025-08-28 13:17:59'),
(273, 9, '2025-08-27 10:02:26', '2025-08-28 13:17:51'),
(274, 9, '2025-08-27 10:06:23', '2025-08-28 13:17:43'),
(275, 9, '2025-08-27 10:43:03', '2025-08-28 13:17:28'),
(276, 9, '2025-08-27 10:54:59', '2025-08-28 13:16:29'),
(277, 9, '2025-08-27 11:12:00', '2025-08-28 13:15:37'),
(278, 9, '2025-08-27 11:29:48', '2025-08-28 13:15:32'),
(279, 9, '2025-08-27 11:38:08', '2025-08-28 13:15:07'),
(280, 9, '2025-08-27 11:39:05', '2025-08-28 13:11:31'),
(281, 9, '2025-08-27 11:57:16', '2025-08-28 13:10:51'),
(282, 9, '2025-08-27 12:21:11', '2025-08-28 13:10:39'),
(283, 9, '2025-08-27 12:21:45', '2025-08-28 12:51:32'),
(284, 9, '2025-08-27 12:40:43', '2025-08-28 12:51:02'),
(285, 27, '2025-08-27 12:43:28', NULL),
(286, 27, '2025-08-27 12:54:32', NULL),
(287, 27, '2025-08-27 12:58:09', '2025-08-28 14:13:31'),
(288, 27, '2025-08-27 13:05:37', '2025-08-28 13:25:04'),
(289, 27, '2025-08-27 13:24:27', '2025-08-28 13:24:19'),
(290, 27, '2025-08-27 13:25:03', '2025-08-28 13:16:23'),
(291, 27, '2025-08-27 13:32:07', '2025-08-28 12:49:58'),
(292, 27, '2025-08-27 13:36:03', '2025-08-28 06:02:38'),
(293, 9, '2025-08-28 03:36:52', '2025-08-28 12:50:34'),
(294, 9, '2025-08-28 03:36:52', '2025-08-28 11:38:59'),
(295, 9, '2025-08-28 03:36:52', '2025-08-28 04:25:19'),
(296, 9, '2025-08-28 04:08:20', '2025-08-28 04:24:23'),
(297, 26, '2025-08-28 04:25:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','cashier','warehouse_manager') NOT NULL,
  `warehouse_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `name`, `email`, `role`, `warehouse_id`) VALUES
(1, 'jessie', 'jessie@gmail.com', 'admin', NULL),
(2, 'james', 'james@gmail.com', 'admin', NULL),
(3, 'dd', 'dd', '', NULL),
(4, 'jj1', 'hh', '', NULL),
(5, 'jj', 'jj', '', NULL),
(6, 'jj', 'sdsa', 'admin', NULL),
(7, 'jjj', 'jjj', 'admin', NULL),
(8, 'qwe', 'qwe', 'admin', NULL),
(9, 'GG', 'GG', 'admin', NULL),
(10, 'asd', 'asd', 'admin', NULL),
(11, 'Sandy Jean A. Panong', 'sandy@gmail.com', 'admin', NULL),
(12, 'admin', 'admin3', 'admin', NULL),
(13, 'admin123', 'admin123@gmail.com', 'admin', NULL),
(14, 'dsa', 'sdsa@dsa', 'warehouse_manager', 2),
(15, 'sdas', 'sdsa@dsa', 'warehouse_manager', 1),
(16, 'dsa', 'sdsa@dsa', 'cashier', NULL),
(17, 'Jessie', 'JessieJamesParajes@gmail.com', 'admin', NULL),
(18, 'JJ', 'JessieJamesParajes@gmail.com', 'admin', NULL),
(19, 'Jessie James', 'jeca.parajes.coc@phinmaed.com', 'admin', NULL),
(21, 'gg', 'sdf@gds', 'warehouse_manager', 1),
(22, 'dsa', 'ad@dsad', 'cashier', NULL),
(23, '12345', 'sdf@gds', 'admin', NULL),
(24, 'warehouse1', 'jeca.parajes.coc@phinmaed.com', 'warehouse_manager', 4),
(25, 'warehouse2', 'jeca.parajes.coc@phinmaed.com', 'warehouse_manager', 5),
(26, 'karel', 'jeca.parajes.coc@gmail.com', 'warehouse_manager', 6),
(27, 'paul', 'jeca.parajes.coc@gmail.com', 'warehouse_manager', 7),
(28, 'cashier1', 'jessiejamesparajes@gmail.com', 'cashier', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_in`
--

CREATE TABLE `stock_in` (
  `stock_in_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `date_received` timestamp NOT NULL DEFAULT current_timestamp(),
  `received_by` int(11) DEFAULT NULL,
  `status` enum('pending','delivered') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_in`
--

INSERT INTO `stock_in` (`stock_in_id`, `product_id`, `supplier_id`, `warehouse_id`, `quantity`, `date_received`, `received_by`, `status`) VALUES
(1, 35, 3, 3, 123, '2025-08-25 09:23:29', 23, 'delivered'),
(2, 35, 7, 1, 2, '2025-08-25 09:28:33', 23, 'delivered'),
(3, 35, 3, 4, 2, '2025-08-27 05:49:07', 9, 'delivered'),
(4, 29, 3, 4, 2, '2025-08-27 06:48:02', 9, 'delivered'),
(5, 34, 3, 6, 5, '2025-08-27 07:09:37', 9, 'delivered'),
(6, 34, 3, 7, 5, '2025-08-27 07:09:45', 9, 'delivered'),
(7, 35, 3, 7, 100, '2025-08-27 07:10:08', 9, 'delivered'),
(8, 34, 3, 7, 2, '2025-08-27 07:44:14', 9, 'delivered'),
(9, 34, 3, 7, 2, '2025-08-28 06:25:21', 27, 'delivered'),
(11, 34, 3, 7, 3, '2025-08-28 06:28:36', 27, 'delivered'),
(12, 34, 3, 7, 2, '2025-08-28 12:14:38', 27, 'delivered'),
(13, 34, 3, 7, 2, '2025-08-28 12:16:46', 27, 'delivered'),
(14, 34, 3, 7, 4, '2025-08-28 12:25:58', 27, 'delivered'),
(15, 34, 3, 7, 6, '2025-08-28 12:26:17', 27, 'delivered'),
(16, 34, 3, 7, 1, '2025-08-28 12:26:38', 27, 'delivered'),
(17, 34, 3, 7, 1, '2025-08-28 12:26:52', 27, 'delivered'),
(18, 34, 3, 7, 2, '2025-08-28 12:29:31', 27, 'delivered'),
(19, 34, 3, 7, 2, '2025-08-28 12:39:50', 27, 'delivered'),
(20, 34, 3, 7, 2, '2025-08-28 12:40:03', 27, 'delivered'),
(21, 34, 3, 7, 2, '2025-08-28 12:44:50', 27, 'delivered'),
(23, 35, 7, 7, 2, '2025-08-28 14:13:05', 27, 'delivered'),
(24, 33, 5, 7, 2, '2025-08-28 14:13:23', 27, 'delivered');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfer`
--

CREATE TABLE `stock_transfer` (
  `transfer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `from_warehouse` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
  `transfer_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `transferred_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transfer`
--

INSERT INTO `stock_transfer` (`transfer_id`, `product_id`, `from_warehouse`, `quantity`, `status`, `transfer_date`, `transferred_by`) VALUES
(8, 34, 7, 5, 'cancelled', '2025-08-28 03:50:14', 9),
(9, 34, 6, 2, 'completed', '2025-08-28 04:17:40', 9),
(10, 35, 7, 7, 'completed', '2025-08-28 04:21:37', 9),
(11, 35, 7, 5, 'completed', '2025-08-28 04:41:44', 9),
(12, 35, 7, 5, 'completed', '2025-08-28 05:06:08', 9),
(13, 35, 7, 5, 'cancelled', '2025-08-28 05:09:10', 9),
(14, 35, 7, 5, 'completed', '2025-08-28 05:09:19', 9),
(20, 35, 1, 22, 'cancelled', '2025-08-28 05:24:45', 9),
(21, 35, 4, 2, 'in_transit', '2025-08-28 05:30:55', 9),
(22, 34, 7, 2, 'completed', '2025-08-28 05:31:14', 9);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `contact_info` varchar(255) NOT NULL,
  `email` varchar(50) NOT NULL,
  `address` varchar(1000) NOT NULL,
  `notes` varchar(1000) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`supplier_id`, `name`, `company_name`, `contact_info`, `email`, `address`, `notes`, `is_active`) VALUES
(2, 'parajes fam', 'jessie house', '09060344441', 'jessiejamesparajes@gmail.com', 'unknown', 't', 0),
(3, 'dsad', 'sad', 'asdsa', 'dsad', 'sad', 'ada', 1),
(4, 'ssa', 'asd', 'asds', 'ads', 'ada', 'sda', 1),
(5, 'sdas', 'das', 'da', 'd', 'das', 'ada', 1),
(6, 'dsa', 'dsa', 'd', 'asd', 'asdas', 'd', 0),
(7, 'jj', 'jj', 'jj', 'jj', 'jj', 'jj', 0);

-- --------------------------------------------------------

--
-- Table structure for table `transactionitem`
--

CREATE TABLE `transactionitem` (
  `order_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `unit_tbl`
--

CREATE TABLE `unit_tbl` (
  `unit_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unit_tbl`
--

INSERT INTO `unit_tbl` (`unit_id`, `name`) VALUES
(1, 'Piece'),
(2, 'Set');

-- --------------------------------------------------------

--
-- Table structure for table `userlogin`
--

CREATE TABLE `userlogin` (
  `user_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userlogin`
--

INSERT INTO `userlogin` (`user_id`, `staff_id`, `username`, `password_hash`, `is_active`) VALUES
(1, 1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1),
(2, 2, 'admin2', '41e5653fc7aeb894026d6bb7b2db7f65902b454945fa8fd65a6327047b5277fb', 1),
(3, 3, 'jj', '123', 1),
(4, 4, 'jj1', '$2y$10$Y0akbVy/PQWsy25cmjU6K.zfS1QROML2jcEbsIuOZ6HXUXjr2znpG', 1),
(5, 5, 'jj', '$2y$10$hK7UAeo4.VbMqfD1kF7vQ.iLpBoVlGWToS00iThJOycHeZbWkd2q6', 1),
(6, 6, 'dsad', '$2y$10$WwcUn7OKNMFrd/rIOBDpVuZ41YJzFlXMIdB6mBOd9.Rndl5g8vENW', 1),
(7, 7, 'jjj', '$2y$10$OCJDqTSDkA4FCgB8qAjLuearExJrNuHxhN10wnNGQQDP3ew8kjguC', 1),
(8, 8, 'qwe', '$2y$10$I.KgJzTfLfgyRU/OpioQoeU/46/7jfAsVCEKO0jLpGoQBFJlEPy8y', 1),
(9, 9, 'GG', '$2y$10$0RG3kyWeWFsaY6tlNNcGPehDaB40Y/x5LxNxdprM8QXearD9rsCP.', 1),
(10, 10, 'asd', '$2y$10$LWVWpQIIA5YJA8raAhi/a.QBww1v4VBXCJ4ONQaa7ZSwu4TVFT0Qe', 1),
(11, 11, 'sandykwaaa', '$2y$10$jMuUCM8qG7weWXMLNsmnd.5jr6Szm4VXleBc7PK9za.Nbwsez7hBK', 1),
(12, 12, 'admin3', '$2y$10$3lE4L0WVario7s.2iUYYy.rt8chr8oKZZ6wtWxifPTc.fq7RyVj8m', 1),
(13, 13, 'admin123', '$2y$10$pA5YkaYxx889jUxEbUdvKuZe2IZXwI3U37dscmBIbkhkoA2iIr28m', 1),
(14, 14, 'dsa', '$2y$10$gVeQ3lopC0Z6khWVLPQdAOBS5rhNjuFurlWvga7q4XBjzzCt.Dev.', 1),
(15, 15, 'sdas', '$2y$10$kN1ZVsJ0mfdeXUCBh/BRL.FY1ofvta2//XcNg/pOcgh8/vflVGvse', 1),
(16, 16, 'dsad', '$2y$10$Aa9wigf3bg5KS6CDwiux9.mJyxH7XkLGP38s5WLUDmLwkAcMBIdPy', 1),
(17, 17, 'JJ', '$2y$10$8mwUfs8BDTNaQ1VyjxDxzOTRM2TyxFaJXAcsDaqE05dXA4ZhGqxhy', 1),
(18, 18, 'JJ', '$2y$10$1E3roriiXqWTVEd2nlezZOWSH5KzULDFkYoGafA9IcO1BECYyrtNG', 1),
(19, 19, 'James', '$2y$10$SjmEk4IsNMMoADXXVXU9je.rh0kBbCSlKPZVyLR.wwEiliHbQDUIi', 1),
(20, 21, 'fds', '$2y$10$CAchgV2lOZpq2wFYdaDx/eTw.i3hcvHbqY3Qvl49Yg64B62hztrrO', 0),
(21, 22, 'dsa', '$2y$10$Rnp4a/FL8QNwhDhVoPT9reUBrdmRS/Em93ec04cqdHKU8Oj0pvjOS', 0),
(22, 23, '12345', '$2y$10$L2O0qhuvuFLd18PlvW6IEeYHuCr.hrhVBnUrRT.7p2gUGyialNqxi', 0),
(23, 24, 'warehouse1', '$2y$10$UHJOVwcQgwgrv3eVBbbYNu2zX8VTzMuYc7HlGsVL/XfxaDpE3dHTq', 1),
(24, 25, 'warehouse2', '$2y$10$03PNwKZuxC4b7hUIu9sZF.11.xaqKlOCu2d314KUAvDUCkovral/O', 1),
(25, 26, 'karel', '$2y$10$7K.Ujk9O1ZsWw6/Kamt3ROHoMmGQGQEZ1MATuxZT1NlQB5yVTfTye', 1),
(26, 27, 'paul', '$2y$10$zkRC.U.ThaYQOnkC.5H7KOH1jZl/O5U/M0EVL/A5BRVmLDxef/wli', 1),
(27, 28, 'cashier1', '$2y$10$mcA0VdBgG1H5TDDpxOMZC.w5NU4tIxttsIwXhTHVDoDasRtjSiJX.', 1);

-- --------------------------------------------------------

--
-- Table structure for table `warehouse`
--

CREATE TABLE `warehouse` (
  `warehouse_id` int(11) NOT NULL,
  `warehouse_name` varchar(100) NOT NULL,
  `location` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouse`
--

INSERT INTO `warehouse` (`warehouse_id`, `warehouse_name`, `location`) VALUES
(1, 'sa', 'sa'),
(2, 'das', 'dasdsa'),
(3, 'dsa', 'dsa'),
(4, 'warehouse1', 'warehouse1'),
(5, 'warehouse2', 'warehouse2'),
(6, 'Warehouse ni Karel', 'Carmen'),
(7, 'Warehouse ni Paul', 'carmen');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`brand_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `product_id` (`product_id`,`warehouse_id`),
  ADD KEY `product_id_2` (`product_id`),
  ADD KEY `warehouse_id` (`warehouse_id`);

--
-- Indexes for table `pos_terminal`
--
ALTER TABLE `pos_terminal`
  ADD PRIMARY KEY (`terminal_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `brand_id` (`brand_id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `product_supplier`
--
ALTER TABLE `product_supplier`
  ADD PRIMARY KEY (`product_supplier_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `salesreturn`
--
ALTER TABLE `salesreturn`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `salestransaction`
--
ALTER TABLE `salestransaction`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `shift`
--
ALTER TABLE `shift`
  ADD PRIMARY KEY (`shift_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `warehouse_id` (`warehouse_id`);

--
-- Indexes for table `stock_in`
--
ALTER TABLE `stock_in`
  ADD PRIMARY KEY (`stock_in_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `warehouse_id` (`warehouse_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  ADD PRIMARY KEY (`transfer_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `from_warehouse` (`from_warehouse`),
  ADD KEY `transferred_by` (`transferred_by`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `transactionitem`
--
ALTER TABLE `transactionitem`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `unit_tbl`
--
ALTER TABLE `unit_tbl`
  ADD PRIMARY KEY (`unit_id`);

--
-- Indexes for table `userlogin`
--
ALTER TABLE `userlogin`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `warehouse`
--
ALTER TABLE `warehouse`
  ADD PRIMARY KEY (`warehouse_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brand`
--
ALTER TABLE `brand`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `pos_terminal`
--
ALTER TABLE `pos_terminal`
  MODIFY `terminal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `product_supplier`
--
ALTER TABLE `product_supplier`
  MODIFY `product_supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `salesreturn`
--
ALTER TABLE `salesreturn`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salestransaction`
--
ALTER TABLE `salestransaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shift`
--
ALTER TABLE `shift`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=298;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `stock_in`
--
ALTER TABLE `stock_in`
  MODIFY `stock_in_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  MODIFY `transfer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `transactionitem`
--
ALTER TABLE `transactionitem`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `unit_tbl`
--
ALTER TABLE `unit_tbl`
  MODIFY `unit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `userlogin`
--
ALTER TABLE `userlogin`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `warehouse`
--
ALTER TABLE `warehouse`
  MODIFY `warehouse_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`warehouse_id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brand` (`brand_id`),
  ADD CONSTRAINT `product_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  ADD CONSTRAINT `product_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`unit_id`),
  ADD CONSTRAINT `product_ibfk_7` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `product_ibfk_8` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `product_supplier`
--
ALTER TABLE `product_supplier`
  ADD CONSTRAINT `product_supplier_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `product_supplier_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `salesreturn`
--
ALTER TABLE `salesreturn`
  ADD CONSTRAINT `salesreturn_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `salestransaction` (`transaction_id`),
  ADD CONSTRAINT `salesreturn_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `salesreturn_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `salestransaction`
--
ALTER TABLE `salestransaction`
  ADD CONSTRAINT `salestransaction_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `salestransaction_ibfk_4` FOREIGN KEY (`terminal_id`) REFERENCES `pos_terminal` (`terminal_id`);

--
-- Constraints for table `shift`
--
ALTER TABLE `shift`
  ADD CONSTRAINT `shift_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`warehouse_id`);

--
-- Constraints for table `stock_in`
--
ALTER TABLE `stock_in`
  ADD CONSTRAINT `stock_in_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `stock_in_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`warehouse_id`),
  ADD CONSTRAINT `stock_in_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  ADD CONSTRAINT `stock_transfer_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `stock_transfer_ibfk_2` FOREIGN KEY (`from_warehouse`) REFERENCES `warehouse` (`warehouse_id`),
  ADD CONSTRAINT `stock_transfer_ibfk_4` FOREIGN KEY (`transferred_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `transactionitem`
--
ALTER TABLE `transactionitem`
  ADD CONSTRAINT `transactionitem_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `salestransaction` (`transaction_id`),
  ADD CONSTRAINT `transactionitem_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `userlogin`
--
ALTER TABLE `userlogin`
  ADD CONSTRAINT `userlogin_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
