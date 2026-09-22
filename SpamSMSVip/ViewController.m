#import "ViewController.h"
#import "MockRequestService.h"
#import "OpenLinkPopup.h"

@interface ViewController ()
@property (nonatomic, strong) UITextField *phoneTextField;
@property (nonatomic, strong) UIButton *eyeButton;
@property (nonatomic, strong) UIButton *runButton;
@property (nonatomic, strong) UISwitch *loopSwitch;
@property (nonatomic, strong) UITextView *logTextView;
@property (nonatomic, strong) NSTimer *loopTimer;
@property (nonatomic, assign) BOOL isPhoneVisible;
@property (nonatomic, assign) BOOL isLooping;
@property (nonatomic, strong) MockRequestService *requestService;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.title = @"SpamSMS";
    self.view.backgroundColor = UIColor.systemGroupedBackgroundColor;
    self.requestService = [[MockRequestService alloc] init];
    [self buildUI];
    [self logMessage:@"Đã dựng lại luồng ứng dụng từ IPA (safe reconstruction)."];
}

- (void)buildUI {
    UILabel *title = [[UILabel alloc] init];
    title.translatesAutoresizingMaskIntoConstraints = NO;
    title.text = @"SpamSMS VIP — Rebuild";
    title.font = [UIFont boldSystemFontOfSize:24];
    title.textAlignment = NSTextAlignmentCenter;

    self.phoneTextField = [[UITextField alloc] init];
    self.phoneTextField.translatesAutoresizingMaskIntoConstraints = NO;
    self.phoneTextField.placeholder = @"Nhập số điện thoại test";
    self.phoneTextField.keyboardType = UIKeyboardTypePhonePad;
    self.phoneTextField.borderStyle = UITextBorderStyleRoundedRect;
    self.phoneTextField.delegate = self;
    [self.phoneTextField addTarget:self action:@selector(phoneNumberChanged:) forControlEvents:UIControlEventEditingChanged];

    self.eyeButton = [UIButton buttonWithType:UIButtonTypeSystem];
    self.eyeButton.translatesAutoresizingMaskIntoConstraints = NO;
    [self.eyeButton setTitle:@"Ẩn" forState:UIControlStateNormal];
    [self.eyeButton addTarget:self action:@selector(eyeButtonTapped:) forControlEvents:UIControlEventTouchUpInside];

    UIStackView *phoneRow = [[UIStackView alloc] initWithArrangedSubviews:@[self.phoneTextField, self.eyeButton]];
    phoneRow.translatesAutoresizingMaskIntoConstraints = NO;
    phoneRow.axis = UILayoutConstraintAxisHorizontal;
    phoneRow.spacing = 10;

    UILabel *loopLabel = [[UILabel alloc] init];
    loopLabel.text = @"Lặp tự động";
    self.loopSwitch = [[UISwitch alloc] init];
    [self.loopSwitch addTarget:self action:@selector(loopSwitchChanged:) forControlEvents:UIControlEventValueChanged];
    UIStackView *loopRow = [[UIStackView alloc] initWithArrangedSubviews:@[loopLabel, self.loopSwitch]];
    loopRow.translatesAutoresizingMaskIntoConstraints = NO;
    loopRow.axis = UILayoutConstraintAxisHorizontal;
    loopRow.distribution = UIStackViewDistributionEqualSpacing;

    self.runButton = [UIButton buttonWithType:UIButtonTypeSystem];
    self.runButton.translatesAutoresizingMaskIntoConstraints = NO;
    self.runButton.configuration = [UIButtonConfiguration filledButtonConfiguration];
    [self.runButton setTitle:@"CHẠY TEST" forState:UIControlStateNormal];
    [self.runButton addTarget:self action:@selector(runButtonTapped:) forControlEvents:UIControlEventTouchUpInside];

    self.logTextView = [[UITextView alloc] init];
    self.logTextView.translatesAutoresizingMaskIntoConstraints = NO;
    self.logTextView.editable = NO;
    self.logTextView.font = [UIFont monospacedSystemFontOfSize:12 weight:UIFontWeightRegular];
    self.logTextView.layer.cornerRadius = 12;
    self.logTextView.backgroundColor = UIColor.secondarySystemGroupedBackgroundColor;

    UIButton *footer = [UIButton buttonWithType:UIButtonTypeSystem];
    footer.translatesAutoresizingMaskIntoConstraints = NO;
    [footer setTitle:@"Thông tin / liên kết" forState:UIControlStateNormal];
    [footer addTarget:self action:@selector(footerLabelTapped:) forControlEvents:UIControlEventTouchUpInside];

    UIStackView *stack = [[UIStackView alloc] initWithArrangedSubviews:@[title, phoneRow, loopRow, self.runButton, self.logTextView, footer]];
    stack.translatesAutoresizingMaskIntoConstraints = NO;
    stack.axis = UILayoutConstraintAxisVertical;
    stack.spacing = 16;
    [self.view addSubview:stack];

    [NSLayoutConstraint activateConstraints:@[
        [stack.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:18],
        [stack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:18],
        [stack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-18],
        [self.logTextView.heightAnchor constraintGreaterThanOrEqualToConstant:280],
        [self.eyeButton.widthAnchor constraintEqualToConstant:54]
    ]];
}

- (void)logMessage:(NSString *)message {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
        formatter.dateFormat = @"HH:mm:ss";
        NSString *line = [NSString stringWithFormat:@"[%@] %@\n", [formatter stringFromDate:[NSDate date]], message];
        self.logTextView.text = [self.logTextView.text stringByAppendingString:line];
        if (self.logTextView.text.length > 0) {
            NSRange bottom = NSMakeRange(self.logTextView.text.length - 1, 1);
            [self.logTextView scrollRangeToVisible:bottom];
        }
    });
}

- (void)phoneNumberChanged:(UITextField *)sender {
    NSCharacterSet *nonDigits = [[NSCharacterSet decimalDigitCharacterSet] invertedSet];
    sender.text = [[sender.text componentsSeparatedByCharactersInSet:nonDigits] componentsJoinedByString:@""];
}

- (void)eyeButtonTapped:(UIButton *)sender {
    self.isPhoneVisible = !self.isPhoneVisible;
    self.phoneTextField.secureTextEntry = !self.isPhoneVisible;
    [sender setTitle:(self.isPhoneVisible ? @"Ẩn" : @"Hiện") forState:UIControlStateNormal];
}

- (void)loopSwitchChanged:(UISwitch *)sender {
    self.isLooping = sender.isOn;
    if (!self.isLooping) {
        [self.loopTimer invalidate];
        self.loopTimer = nil;
        [self logMessage:@"Đã tắt chế độ lặp."];
    } else {
        [self logMessage:@"Đã bật chế độ lặp test."];
    }
}

- (void)runButtonTapped:(UIButton *)sender {
    if (self.phoneTextField.text.length < 8) {
        [self logMessage:@"Số điện thoại test không hợp lệ."];
        return;
    }

    [self sendOTPAndNewOTPRequests];

    if (self.isLooping && !self.loopTimer) {
        self.loopTimer = [NSTimer scheduledTimerWithTimeInterval:30.0 target:self selector:@selector(sendOTPAndNewOTPRequests) userInfo:nil repeats:YES];
    }
}

- (void)sendOTPAndNewOTPRequests {
    NSString *phone = self.phoneTextField.text ?: @"";
    [self.requestService cancel];
    [self logMessage:[NSString stringWithFormat:@"Bắt đầu lượt test cho %@", phone]];

    __weak typeof(self) weakSelf = self;
    [self.requestService runTestForPhone:phone completion:^(NSString *service, BOOL success, NSString *message) {
        NSString *status = success ? @"✓" : @"•";
        [weakSelf logMessage:[NSString stringWithFormat:@"%@ %@ — %@", status, service, message]];
    }];
}

- (void)footerLabelTapped:(id)sender {
    NSURL *URL = [NSURL URLWithString:@"https://bio.ctdotech.tech/prj-theos"];
    OpenLinkPopup *popup = [[OpenLinkPopup alloc] initWithTitle:@"Thông tin" message:@"Liên kết được tìm thấy trong binary gốc." URL:URL];
    [self presentViewController:popup animated:YES completion:nil];
}

- (void)tv360 { [self sendOTPAndNewOTPRequests]; }
- (void)viettel_login_dang_nhap { [self sendOTPAndNewOTPRequests]; }
- (void)viettel_tao_tai_khoan { [self sendOTPAndNewOTPRequests]; }
- (void)sapo_tao_acc { [self sendOTPAndNewOTPRequests]; }
- (void)modcha { [self sendOTPAndNewOTPRequests]; }
- (void)vieon { [self sendOTPAndNewOTPRequests]; }
- (void)fptshop { [self sendOTPAndNewOTPRequests]; }
- (void)fptshop1 { [self sendOTPAndNewOTPRequests]; }
- (void)galaxyplay { [self sendOTPAndNewOTPRequests]; }
- (void)Shine30 { [self sendOTPAndNewOTPRequests]; }
- (void)Shine30_test { [self sendOTPAndNewOTPRequests]; }
- (void)cathay { [self sendOTPAndNewOTPRequests]; }
- (void)dominos { [self sendOTPAndNewOTPRequests]; }
- (void)batdongsan { [self sendOTPAndNewOTPRequests]; }
- (void)fahase { [self sendOTPAndNewOTPRequests]; }
- (void)shopiness { [self sendOTPAndNewOTPRequests]; }
- (void)viettelpost { [self sendOTPAndNewOTPRequests]; }
- (void)bibabo { [self sendOTPAndNewOTPRequests]; }
- (void)owen { [self sendOTPAndNewOTPRequests]; }
- (void)pnj { [self sendOTPAndNewOTPRequests]; }
- (void)f88 { [self sendOTPAndNewOTPRequests]; }
- (void)heyu { [self sendOTPAndNewOTPRequests]; }
- (void)thecoffee { [self sendOTPAndNewOTPRequests]; }
- (void)dienmayxanh { [self sendOTPAndNewOTPRequests]; }
- (void)kingfoodmart { [self sendOTPAndNewOTPRequests]; }
- (void)ghn { [self sendOTPAndNewOTPRequests]; }
- (void)lottemart { [self sendOTPAndNewOTPRequests]; }
- (void)vayvnd { [self sendOTPAndNewOTPRequests]; }
- (void)vato { [self sendOTPAndNewOTPRequests]; }
- (void)nhathuoclongchau { [self sendOTPAndNewOTPRequests]; }
- (void)vinamilk { [self sendOTPAndNewOTPRequests]; }
- (void)glxplay { [self sendOTPAndNewOTPRequests]; }
- (void)shopee { [self sendOTPAndNewOTPRequests]; }
- (void)watsons { [self sendOTPAndNewOTPRequests]; }
- (void)tokyolife { [self sendOTPAndNewOTPRequests]; }
- (void)go2joy { [self sendOTPAndNewOTPRequests]; }

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
    [textField resignFirstResponder];
    return YES;
}

@end
